import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: Generate image using Satori + Sharp pipeline
  return NextResponse.json({ data: null, error: null });
}
