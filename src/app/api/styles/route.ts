import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Fetch available copy styles and design tones
  return NextResponse.json({ data: null, error: null });
}
