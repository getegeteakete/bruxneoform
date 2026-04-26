import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD || 'brux2026';
    if (password === adminPassword) {
      return NextResponse.json({ ok: true, token: Buffer.from(`admin:${Date.now()}`).toString('base64') });
    }
    return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'エラー' }, { status: 500 });
  }
}
