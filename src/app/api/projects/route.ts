import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Fetch user's projects
  return NextResponse.json({ data: [], error: null });
}

export async function POST() {
  // TODO: Create new project
  return NextResponse.json({ data: null, error: null });
}
