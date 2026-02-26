/**
 * /api/contents — Enhanced contents CRUD API
 *
 * GET  /api/contents?projectId=xxx&channel=blog&status=draft
 *   → { data: GeneratedContent[], error: null }
 *
 * POST /api/contents
 *   Body: { action: 'create' | 'update' | 'delete' | 'bulk_approve' | 'bulk_delete', ...payload }
 *   → { data: { success: true, affectedIds: string[] }, error: null }
 *
 * MVP: Validation is enforced; actual DB persistence is stubbed out.
 * Supabase integration will be layered on in a future session.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ChannelType, ContentStatus, GeneratedContent } from '@/types/content';

// ── Allowed enum values (kept in sync with DB CHECK constraints) ───────────────

const VALID_CHANNELS: ChannelType[] = ['site', 'blog', 'instagram', 'shortform'];
const VALID_STATUSES: ContentStatus[] = ['draft', 'approved', 'scheduled', 'published'];

// ── Error helper ───────────────────────────────────────────────────────────────

function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ data: null, error: message }, { status });
}

// ── GET /api/contents ─────────────────────────────────────────────────────────

/**
 * Fetch generated contents for a project, with optional filters.
 *
 * Query parameters:
 *   projectId  (required) — UUID of the project
 *   channel    (optional) — one of: site | blog | instagram | shortform
 *   status     (optional) — one of: draft | approved | scheduled | published
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;

    const projectId = searchParams.get('projectId');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');

    // Validate: projectId required
    if (!projectId || projectId.trim() === '') {
      return errorResponse('projectId is required');
    }

    // Validate: channel must be a known value (if provided)
    if (channel !== null && !VALID_CHANNELS.includes(channel as ChannelType)) {
      return errorResponse(
        `channel must be one of: ${VALID_CHANNELS.join(', ')}`
      );
    }

    // Validate: status must be a known value (if provided)
    if (status !== null && !VALID_STATUSES.includes(status as ContentStatus)) {
      return errorResponse(
        `status must be one of: ${VALID_STATUSES.join(', ')}`
      );
    }

    // TODO: Replace with Supabase query once DB integration is complete.
    // Supabase query skeleton for reference:
    //
    // const supabase = createServerClient();
    // let query = supabase
    //   .from('generated_contents')
    //   .select('*')
    //   .eq('project_id', projectId)
    //   .order('created_at', { ascending: false });
    //
    // if (channel) query = query.eq('channel', channel);
    // if (status)  query = query.eq('status', status);
    //
    // const { data, error } = await query;
    // if (error) return errorResponse(error.message, 500);
    // return NextResponse.json({ data: data ?? [], error: null });

    const contents: GeneratedContent[] = [];

    return NextResponse.json({ data: contents, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}

// ── POST body shapes ───────────────────────────────────────────────────────────

interface CreateBody {
  action: 'create';
  projectId: string;
  channel: ChannelType;
  contentType: string;
  title?: string;
  body?: Record<string, unknown>;
  images?: string[];
  copyStyle?: string;
  designTone?: string;
  status?: ContentStatus;
  scheduledAt?: string;
}

interface UpdateBody {
  action: 'update';
  id: string;
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
}

interface DeleteBody {
  action: 'delete';
  id: string;
}

interface BulkApproveBody {
  action: 'bulk_approve';
  ids: string[];
}

interface BulkDeleteBody {
  action: 'bulk_delete';
  ids: string[];
}

type PostBody =
  | CreateBody
  | UpdateBody
  | DeleteBody
  | BulkApproveBody
  | BulkDeleteBody;

// ── POST /api/contents ────────────────────────────────────────────────────────

/**
 * Perform a mutating content operation.
 *
 * Supported actions:
 *   create        — Save new content (projectId, channel, contentType required)
 *   update        — Change status / scheduling (id, status required)
 *   delete        — Soft-delete a single content item (id required)
 *   bulk_approve  — Approve multiple items at once (ids[] required)
 *   bulk_delete   — Delete multiple items at once (ids[] required)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let requestBody: PostBody;

    try {
      requestBody = (await request.json()) as PostBody;
    } catch {
      return errorResponse('Invalid JSON body');
    }

    const { action } = requestBody;

    if (!action) {
      return errorResponse('action is required');
    }

    switch (action) {
      case 'create': {
        const result = handleCreate(requestBody as CreateBody);
        if (result.error) return errorResponse(result.error);
        return buildSuccessResponse(result.affectedIds);
      }

      case 'update': {
        const result = handleUpdate(requestBody as UpdateBody);
        if (result.error) return errorResponse(result.error);
        return buildSuccessResponse(result.affectedIds);
      }

      case 'delete': {
        const result = handleDelete(requestBody as DeleteBody);
        if (result.error) return errorResponse(result.error);
        return buildSuccessResponse(result.affectedIds);
      }

      case 'bulk_approve': {
        const result = handleBulkApprove(requestBody as BulkApproveBody);
        if (result.error) return errorResponse(result.error);
        return buildSuccessResponse(result.affectedIds);
      }

      case 'bulk_delete': {
        const result = handleBulkDelete(requestBody as BulkDeleteBody);
        if (result.error) return errorResponse(result.error);
        return buildSuccessResponse(result.affectedIds);
      }

      default: {
        return errorResponse(
          'action must be one of: create, update, delete, bulk_approve, bulk_delete'
        );
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(message, 500);
  }
}

// ── Action handlers ────────────────────────────────────────────────────────────

interface HandlerResult {
  affectedIds: string[];
  error?: string;
}

/** Validate and stub-handle a 'create' action. */
function handleCreate(body: CreateBody): HandlerResult {
  if (!body.projectId || body.projectId.trim() === '') {
    return { affectedIds: [], error: 'projectId is required for create' };
  }

  if (!body.channel) {
    return { affectedIds: [], error: 'channel is required for create' };
  }

  if (!VALID_CHANNELS.includes(body.channel)) {
    return {
      affectedIds: [],
      error: `channel must be one of: ${VALID_CHANNELS.join(', ')}`,
    };
  }

  if (!body.contentType || body.contentType.trim() === '') {
    return { affectedIds: [], error: 'contentType is required for create' };
  }

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return {
      affectedIds: [],
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    };
  }

  // TODO: Insert into Supabase:
  //
  // const supabase = createServerClient();
  // const { data, error } = await supabase
  //   .from('generated_contents')
  //   .insert({
  //     project_id:    body.projectId,
  //     channel:       body.channel,
  //     content_type:  body.contentType,
  //     title:         body.title,
  //     body:          body.body ?? {},
  //     images:        body.images ?? [],
  //     copy_style:    body.copyStyle,
  //     design_tone:   body.designTone,
  //     status:        body.status ?? 'draft',
  //     scheduled_at:  body.scheduledAt,
  //   })
  //   .select('id')
  //   .single();
  //
  // if (error) return { affectedIds: [], error: error.message };
  // return { affectedIds: [data.id] };

  const stubId = generateStubId();
  return { affectedIds: [stubId] };
}

/** Validate and stub-handle an 'update' action. */
function handleUpdate(body: UpdateBody): HandlerResult {
  if (!body.id || body.id.trim() === '') {
    return { affectedIds: [], error: 'id is required for update' };
  }

  if (!body.status) {
    return { affectedIds: [], error: 'status is required for update' };
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return {
      affectedIds: [],
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    };
  }

  // Validate scheduling: if status is 'scheduled', scheduledAt must be provided
  if (body.status === 'scheduled' && !body.scheduledAt) {
    return {
      affectedIds: [],
      error: 'scheduledAt is required when status is "scheduled"',
    };
  }

  // TODO: Update in Supabase:
  //
  // const supabase = createServerClient();
  // const updatePayload: Record<string, unknown> = { status: body.status };
  // if (body.scheduledAt) updatePayload.scheduled_at = body.scheduledAt;
  // if (body.publishedAt)  updatePayload.published_at = body.publishedAt;
  //
  // const { error } = await supabase
  //   .from('generated_contents')
  //   .update(updatePayload)
  //   .eq('id', body.id);
  //
  // if (error) return { affectedIds: [], error: error.message };
  // return { affectedIds: [body.id] };

  return { affectedIds: [body.id] };
}

/** Validate and stub-handle a 'delete' action. */
function handleDelete(body: DeleteBody): HandlerResult {
  if (!body.id || body.id.trim() === '') {
    return { affectedIds: [], error: 'id is required for delete' };
  }

  // TODO: Soft-delete in Supabase (or hard-delete, depending on policy):
  //
  // const supabase = createServerClient();
  // const { error } = await supabase
  //   .from('generated_contents')
  //   .delete()
  //   .eq('id', body.id);
  //
  // if (error) return { affectedIds: [], error: error.message };
  // return { affectedIds: [body.id] };

  return { affectedIds: [body.id] };
}

/** Validate and stub-handle a 'bulk_approve' action. */
function handleBulkApprove(body: BulkApproveBody): HandlerResult {
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return { affectedIds: [], error: 'ids[] is required and must not be empty for bulk_approve' };
  }

  const invalidIds = body.ids.filter((id) => typeof id !== 'string' || id.trim() === '');
  if (invalidIds.length > 0) {
    return { affectedIds: [], error: 'All ids must be non-empty strings' };
  }

  // TODO: Bulk update in Supabase:
  //
  // const supabase = createServerClient();
  // const { error } = await supabase
  //   .from('generated_contents')
  //   .update({ status: 'approved' })
  //   .in('id', body.ids);
  //
  // if (error) return { affectedIds: [], error: error.message };
  // return { affectedIds: body.ids };

  return { affectedIds: body.ids };
}

/** Validate and stub-handle a 'bulk_delete' action. */
function handleBulkDelete(body: BulkDeleteBody): HandlerResult {
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return { affectedIds: [], error: 'ids[] is required and must not be empty for bulk_delete' };
  }

  const invalidIds = body.ids.filter((id) => typeof id !== 'string' || id.trim() === '');
  if (invalidIds.length > 0) {
    return { affectedIds: [], error: 'All ids must be non-empty strings' };
  }

  // TODO: Bulk delete in Supabase:
  //
  // const supabase = createServerClient();
  // const { error } = await supabase
  //   .from('generated_contents')
  //   .delete()
  //   .in('id', body.ids);
  //
  // if (error) return { affectedIds: [], error: error.message };
  // return { affectedIds: body.ids };

  return { affectedIds: body.ids };
}

// ── Response builder ───────────────────────────────────────────────────────────

function buildSuccessResponse(affectedIds: string[]): NextResponse {
  return NextResponse.json({
    data: { success: true, affectedIds },
    error: null,
  });
}

// ── Stub ID generator ─────────────────────────────────────────────────────────

/**
 * Generate a UUID-shaped stub ID for MVP responses where we have no real DB.
 * Replace with actual DB-returned IDs once Supabase is wired up.
 */
function generateStubId(): string {
  // Use crypto.randomUUID if available (Node 19+, modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: hand-rolled UUID v4 shape
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
