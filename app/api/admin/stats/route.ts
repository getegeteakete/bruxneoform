export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const formId = req.nextUrl.searchParams.get('form_id') || 'demo';

    // 総送信数
    const { count: totalSubmissions } = await supabaseAdmin
      .from('submissions').select('*', { count: 'exact', head: true }).eq('form_id', formId);

    // 今日の送信数
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todaySubmissions } = await supabaseAdmin
      .from('submissions').select('*', { count: 'exact', head: true })
      .eq('form_id', formId).gte('created_at', todayStart.toISOString());

    // メール送信成功数
    const { count: emailsSent } = await supabaseAdmin
      .from('submissions').select('*', { count: 'exact', head: true })
      .eq('form_id', formId).eq('status', 'sent');

    // スパムブロック数
    const { count: spamBlocked } = await supabaseAdmin
      .from('spam_logs').select('*', { count: 'exact', head: true }).eq('form_id', formId);

    // 直近7日分の日別送信数
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recentSubmissions } = await supabaseAdmin
      .from('submissions').select('created_at')
      .eq('form_id', formId).gte('created_at', sevenDaysAgo).order('created_at', { ascending: true });

    const dailyCounts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dailyCounts[d.toISOString().split('T')[0]] = 0;
    }
    recentSubmissions?.forEach(s => {
      const day = s.created_at.split('T')[0];
      if (dailyCounts[day] !== undefined) dailyCounts[day]++;
    });

    // ステップ別離脱数
    const { data: stepEvents } = await supabaseAdmin
      .from('form_events').select('step_index, event_type')
      .eq('form_id', formId).in('event_type', ['step_view', 'page_leave']);

    const stepViews: Record<number, number> = {};
    (stepEvents || []).forEach(e => {
      if (e.event_type === 'step_view' && e.step_index !== null) {
        stepViews[e.step_index] = (stepViews[e.step_index] || 0) + 1;
      }
    });

    return NextResponse.json({
      totalSubmissions: totalSubmissions || 0,
      todaySubmissions: todaySubmissions || 0,
      emailsSent: emailsSent || 0,
      spamBlocked: spamBlocked || 0,
      deliveryRate: totalSubmissions ? Math.round(((emailsSent || 0) / totalSubmissions) * 100) : 0,
      dailyCounts,
      stepViews,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: 'stats error' }, { status: 500 });
  }
}
