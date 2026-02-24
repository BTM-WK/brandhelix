import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Fetch generated contents
  return NextResponse.json({ data: [], error: null });
}

export async function POST() {
  // TODO: Update content status (approve/schedule/publish)
  return NextResponse.json({ data: null, error: null });
}
