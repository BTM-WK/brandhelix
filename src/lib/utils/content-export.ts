/**
 * Content export utilities for BrandHelix.
 *
 * Client-side only — uses standard Web APIs (Blob, URL.createObjectURL).
 * No external dependencies required.
 *
 * Supports:
 *   - Blog → Markdown (.md)
 *   - Blog → HTML (.html)
 *   - Instagram image → PNG (from base64)
 *   - Batch export (multiple contents, sequential downloads)
 */

import type { GeneratedContent } from '@/types/content';

// ── Slug helper ────────────────────────────────────────────────────────────────

/**
 * Convert a string to a URL/filename-safe slug.
 * Korean + English safe: normalises unicode, strips special chars,
 * replaces whitespace with hyphens, lowercases, caps at 50 characters.
 */
export function slugify(text: string): string {
  return text
    .trim()
    // Decompose combined Korean characters so NFD strips diacritics from Latin;
    // Korean syllable blocks are kept intact after recomposition (NFC).
    .normalize('NFC')
    // Replace runs of whitespace with a single hyphen
    .replace(/\s+/g, '-')
    // Remove characters that are not alphanumeric, Korean, or hyphens
    .replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\-]/g, '')
    .toLowerCase()
    // Collapse multiple consecutive hyphens
    .replace(/-{2,}/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// ── Date formatting helper ─────────────────────────────────────────────────────

/** Return a compact ISO date string (YYYY-MM-DD) from an ISO timestamp. */
function isoDate(isoString: string): string {
  try {
    return new Date(isoString).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// ── Blog section type (matches BlogBody in types/blog.ts) ─────────────────────

interface BlogSection {
  heading: string;
  body: string;
}

// ── Blog → Markdown ────────────────────────────────────────────────────────────

/**
 * Export a blog GeneratedContent as a Markdown (.md) file.
 *
 * Body resolution order:
 *   1. body.markdown  — pre-rendered Markdown string
 *   2. body.sections  — BlogSection[] structured format
 *   3. Fallback to body.title + body.conclusion as plain text
 *
 * Returns { filename, blob } — call downloadBlob() to trigger the download.
 */
export function exportBlogAsMarkdown(content: GeneratedContent): {
  filename: string;
  blob: Blob;
} {
  const body = content.body as Record<string, unknown>;
  const title = (body.title as string | undefined) ?? content.title ?? 'Untitled';
  const date = isoDate(content.createdAt);
  const slug = slugify(title);
  const filename = `blog_${slug}_${date}.md`;

  let markdown: string;

  if (typeof body.markdown === 'string' && body.markdown.trim().length > 0) {
    // Pre-rendered Markdown already available
    markdown = body.markdown;
  } else {
    // Build Markdown from structured BlogBody fields
    const lines: string[] = [];

    // H1 title
    lines.push(`# ${title}`);
    lines.push('');

    // Meta description as blockquote
    if (typeof body.metaDescription === 'string' && body.metaDescription) {
      lines.push(`> ${body.metaDescription}`);
      lines.push('');
    }

    // Sections
    if (Array.isArray(body.sections)) {
      for (const section of body.sections as BlogSection[]) {
        if (section.heading) {
          lines.push(`## ${section.heading}`);
          lines.push('');
        }
        if (section.body) {
          lines.push(section.body);
          lines.push('');
        }
      }
    }

    // Conclusion
    if (typeof body.conclusion === 'string' && body.conclusion) {
      lines.push('## 마무리');
      lines.push('');
      lines.push(body.conclusion);
      lines.push('');
    }

    // CTA
    if (typeof body.cta === 'string' && body.cta) {
      lines.push('---');
      lines.push('');
      lines.push(body.cta);
      lines.push('');
    }

    // Tags
    if (Array.isArray(body.tags) && (body.tags as string[]).length > 0) {
      const tagLine = (body.tags as string[])
        .map((t: string) => `#${t.replace(/^#/, '')}`)
        .join(' ');
      lines.push(tagLine);
      lines.push('');
    }

    // Footer metadata
    lines.push('---');
    lines.push(`*Generated: ${date}*`);
    if (content.copyStyle) {
      lines.push(`*Copy style: ${content.copyStyle}*`);
    }

    markdown = lines.join('\n');
  }

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  return { filename, blob };
}

// ── Blog → HTML ────────────────────────────────────────────────────────────────

export interface BlogHtmlOptions {
  /** Wrap content in a full HTML document with base styles. Default: true */
  includeStyles?: boolean;
}

/**
 * Export a blog GeneratedContent as a standalone HTML (.html) file.
 *
 * Body resolution order:
 *   1. body.html   — pre-rendered HTML string
 *   2. body.markdown → convert with simple inline transforms
 *   3. body.sections → build HTML from structured fields
 *
 * Returns { filename, blob } — call downloadBlob() to trigger the download.
 */
export function exportBlogAsHtml(
  content: GeneratedContent,
  options?: BlogHtmlOptions
): { filename: string; blob: Blob } {
  const includeStyles = options?.includeStyles !== false; // default true
  const body = content.body as Record<string, unknown>;
  const title = (body.title as string | undefined) ?? content.title ?? 'Untitled';
  const date = isoDate(content.createdAt);
  const slug = slugify(title);
  const filename = `blog_${slug}_${date}.html`;

  let innerHtml: string;

  if (typeof body.html === 'string' && body.html.trim().length > 0) {
    innerHtml = body.html;
  } else if (typeof body.markdown === 'string' && body.markdown.trim().length > 0) {
    innerHtml = simpleMarkdownToHtml(body.markdown);
  } else {
    // Build from structured BlogBody fields
    const parts: string[] = [];

    parts.push(`<h1>${escapeHtml(title)}</h1>`);

    if (typeof body.metaDescription === 'string' && body.metaDescription) {
      parts.push(`<blockquote>${escapeHtml(body.metaDescription)}</blockquote>`);
    }

    if (Array.isArray(body.sections)) {
      for (const section of body.sections as BlogSection[]) {
        if (section.heading) {
          parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
        }
        if (section.body) {
          // Treat each section body as plain paragraphs separated by double newlines
          const paragraphs = section.body
            .split(/\n\n+/)
            .map((p) => `<p>${escapeHtml(p.trim())}</p>`);
          parts.push(paragraphs.join('\n'));
        }
      }
    }

    if (typeof body.conclusion === 'string' && body.conclusion) {
      parts.push('<h2>마무리</h2>');
      parts.push(`<p>${escapeHtml(body.conclusion)}</p>`);
    }

    if (typeof body.cta === 'string' && body.cta) {
      parts.push(`<hr>`);
      parts.push(`<p class="cta">${escapeHtml(body.cta)}</p>`);
    }

    if (Array.isArray(body.tags) && (body.tags as string[]).length > 0) {
      const tagHtml = (body.tags as string[])
        .map((t: string) => `<span class="tag">#${escapeHtml(t.replace(/^#/, ''))}</span>`)
        .join(' ');
      parts.push(`<div class="tags">${tagHtml}</div>`);
    }

    innerHtml = parts.join('\n');
  }

  const html = includeStyles
    ? buildFullHtmlDocument(title, innerHtml, date, content.copyStyle)
    : innerHtml;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return { filename, blob };
}

// ── Instagram image → PNG ──────────────────────────────────────────────────────

/**
 * Convert a base64-encoded PNG/JPEG data URI (or raw base64 string) to a
 * downloadable PNG Blob.
 *
 * Returns { filename, blob } — call downloadBlob() to trigger the download.
 */
export function exportInstagramImage(
  imageBase64: string,
  filename: string
): { filename: string; blob: Blob } {
  // Detect and strip data URI prefix, e.g. "data:image/png;base64,"
  let base64Data: string;
  let mimeType = 'image/png';

  const dataUriMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUriMatch) {
    mimeType = dataUriMatch[1] ?? 'image/png';
    base64Data = dataUriMatch[2] ?? '';
  } else {
    // Assume raw base64 string
    base64Data = imageBase64;
  }

  // Decode base64 → binary string → Uint8Array
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return { filename, blob };
}

// ── Trigger browser download ───────────────────────────────────────────────────

/**
 * Trigger a browser file download for the given Blob.
 * Creates a temporary <a> element, clicks it, then revokes the object URL.
 *
 * Browser-compatible; no server-side code.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke after a tick to let the browser initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ── Batch export ───────────────────────────────────────────────────────────────

export interface BatchExportOptions {
  /** Format for blog exports. Default: 'markdown' */
  format?: 'markdown' | 'html';
}

/**
 * Batch-export multiple contents by triggering individual downloads with a
 * 100 ms delay between each to avoid browser popup blockers.
 *
 * Behaviour per channel:
 *   - blog      → Markdown or HTML based on options.format
 *   - instagram → PNG per image in content.images array (base64 expected)
 *   - site / shortform → JSON fallback export
 */
export async function exportBatchContent(
  contents: GeneratedContent[],
  options?: BatchExportOptions
): Promise<void> {
  const format = options?.format ?? 'markdown';

  /**
   * Delays execution by `ms` milliseconds.
   * Extracted to avoid no-await-in-loop lint issues when used inside a loop.
   */
  const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (const content of contents) {
    switch (content.channel) {
      case 'blog': {
        if (format === 'html') {
          const { blob, filename } = exportBlogAsHtml(content);
          downloadBlob(blob, filename);
        } else {
          const { blob, filename } = exportBlogAsMarkdown(content);
          downloadBlob(blob, filename);
        }
        break;
      }

      case 'instagram': {
        if (content.images.length > 0) {
          const date = isoDate(content.createdAt);
          const contentTypePart = slugify(content.contentType || 'post');
          for (let idx = 0; idx < content.images.length; idx++) {
            const imageData = content.images[idx] ?? '';
            // Only export images that look like base64 data URIs or raw base64;
            // skip plain URLs (http/https) as they cannot be decoded client-side.
            if (imageData.startsWith('data:') || isLikelyBase64(imageData)) {
              const filename = `instagram_${contentTypePart}_${date}_slide${idx + 1}.png`;
              const { blob, filename: resolvedFilename } = exportInstagramImage(
                imageData,
                filename
              );
              downloadBlob(blob, resolvedFilename);
              await delay(100);
            }
          }
        } else {
          // No images — export caption/body as JSON fallback
          downloadAsJson(content);
        }
        break;
      }

      default: {
        // site, shortform → JSON fallback
        downloadAsJson(content);
        break;
      }
    }

    await delay(100);
  }
}

// ── Private helpers ────────────────────────────────────────────────────────────

/**
 * Escape the five core HTML entities.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Minimal Markdown → HTML converter used as a fallback inside exportBlogAsHtml.
 * Handles headings, bold, italic, blockquotes, list items, and paragraphs.
 * For full rendering the codebase already has src/lib/utils/markdown.ts.
 */
function simpleMarkdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const parts: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Heading detection
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (inList) { parts.push('</ul>'); inList = false; }
      const level = headingMatch[1]!.length;
      parts.push(`<h${level}>${escapeHtml(headingMatch[2]!)}</h${level}>`);
      continue;
    }

    // Unordered list item
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList) { parts.push('<ul>'); inList = true; }
      parts.push(`<li>${escapeHtml(ulMatch[1]!)}</li>`);
      continue;
    }

    // Blockquote
    const bqMatch = line.match(/^>\s?(.*)$/);
    if (bqMatch) {
      if (inList) { parts.push('</ul>'); inList = false; }
      parts.push(`<blockquote>${escapeHtml(bqMatch[1]!)}</blockquote>`);
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      if (inList) { parts.push('</ul>'); inList = false; }
      parts.push('<hr>');
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      if (inList) { parts.push('</ul>'); inList = false; }
      continue;
    }

    // Regular paragraph
    if (inList) { parts.push('</ul>'); inList = false; }
    // Apply inline formatting: bold, italic
    let inline = escapeHtml(line);
    inline = inline.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    inline = inline.replace(/\*(.+?)\*/g, '<em>$1</em>');
    parts.push(`<p>${inline}</p>`);
  }

  if (inList) parts.push('</ul>');
  return parts.join('\n');
}

/**
 * Wrap inner HTML in a full standalone HTML document with basic blog styles.
 */
function buildFullHtmlDocument(
  title: string,
  innerHtml: string,
  date: string,
  copyStyle?: string
): string {
  const metaTitle = escapeHtml(title);
  const styleNote = copyStyle ? `Copy style: ${escapeHtml(copyStyle)} | ` : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metaTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR",
                   "Apple SD Gothic Neo", sans-serif;
      font-size: 16px;
      line-height: 1.8;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }
    h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5em; color: #111; }
    h2 { font-size: 1.4rem; font-weight: 700; margin-top: 2em; margin-bottom: 0.5em; color: #222; }
    h3 { font-size: 1.15rem; font-weight: 600; margin-top: 1.5em; color: #333; }
    p  { margin: 0 0 1.25em; }
    blockquote {
      margin: 1.5em 0;
      padding: 1em 1.25em;
      border-left: 4px solid #0066cc;
      background: #f0f6ff;
      color: #444;
      font-style: italic;
    }
    ul { padding-left: 1.75em; margin-bottom: 1.25em; }
    li { margin-bottom: 0.35em; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 2em 0; }
    .cta {
      font-weight: 600;
      color: #0066cc;
    }
    .tags { margin-top: 1.5em; }
    .tag {
      display: inline-block;
      margin: 0 6px 6px 0;
      padding: 2px 8px;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 0.875em;
      color: #555;
    }
    .meta {
      margin-top: 3em;
      padding-top: 1em;
      border-top: 1px solid #e5e7eb;
      font-size: 0.8125em;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    ${innerHtml}
    <div class="meta">${styleNote}Generated: ${escapeHtml(date)}</div>
  </div>
</body>
</html>`;
}

/**
 * Download a GeneratedContent as a JSON file (fallback for unsupported channels).
 */
function downloadAsJson(content: GeneratedContent): void {
  const title = (content.body as Record<string, unknown>).title as string | undefined;
  const label = title ?? content.contentType ?? content.channel;
  const date = isoDate(content.createdAt);
  const filename = `${content.channel}_${slugify(label)}_${date}.json`;
  const json = JSON.stringify(content, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * Heuristic check: does the string look like raw base64 (not a URL)?
 * Returns true if the string contains only base64 characters and is long enough
 * to plausibly be image data.
 */
function isLikelyBase64(str: string): boolean {
  if (str.length < 100) return false;
  if (str.startsWith('http://') || str.startsWith('https://')) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(str.slice(0, 200));
}
