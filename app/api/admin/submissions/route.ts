export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const formId = req.nextUrl.searchParams.get('form_id') || 'demo';
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const { data, count } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact' })
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      submissions: data || [],
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('Submissions list error:', err);
    return NextResponse.json({ error: 'fetch error' }, { status: 500 });
  }
}
