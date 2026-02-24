import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Auth status check
  return NextResponse.json({ data: null, error: null });
}

export async function POST() {
  // TODO: Auth action (login/signup/logout)
  return NextResponse.json({ data: null, error: null });
}
