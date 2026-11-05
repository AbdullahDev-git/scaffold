import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pitchId, seconds } = body as { pitchId?: string; seconds?: number };

    if (!pitchId || typeof seconds !== 'number' || seconds < 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const db = await store();
    await db.updateViewSeconds(pitchId, seconds);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}