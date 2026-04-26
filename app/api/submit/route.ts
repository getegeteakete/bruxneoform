export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// スパムキーワードリスト
const SPAM_KEYWORDS = ['casino', 'viagra', 'lottery', 'crypto', 'bitcoin', 'click here', 'free money'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { form_id, answers, honeypot, elapsed_ms } = body;

    // === スパム対策 4層 ===

    // 1. ハニーポット
    if (honeypot) {
      await logSpam(form_id, 'honeypot', req);
      return NextResponse.json({ success: true }); // スパムにはOKを返す
    }

    // 2. 送信速度チェック（3秒以内は怪しい）
    if (elapsed_ms && elapsed_ms < 3000) {
      await logSpam(form_id, 'too_fast', req);
      return NextResponse.json({ success: true });
    }

    // 3. キーワードフィルター
    const allText = Object.values(answers).join(' ').toLowerCase();
    if (SPAM_KEYWORDS.some(kw => allText.includes(kw))) {
      await logSpam(form_id, 'keyword', req);
      return NextResponse.json({ success: true });
    }

    // 4. レート制限（同一IPから1分間に3回以上）
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitOk = await checkRateLimit(form_id, clientIp);
    if (!rateLimitOk) {
      return NextResponse.json({ error: '送信回数の制限を超えました。少し時間をおいてお試しください。' }, { status: 429 });
    }

    // === 送信データ保存 ===
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .insert({
        form_id,
        email: answers.email || null,
        name: answers.contact_name || answers.company_name || null,
        answers,
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent') || '',
        status: 'received',
      })
      .select()
      .single();

    if (subError) {
      console.error('Submission insert error:', subError);
      return NextResponse.json({ error: '送信データの保存に失敗しました' }, { status: 500 });
    }

    // === メール送信（Resend） ===
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        // 管理者通知メール
        const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'info@brux.jp';
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        const answersHtml = Object.entries(answers)
          .map(([key, val]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:140px;font-size:13px;">${key}</td><td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${Array.isArray(val) ? val.join('、') : val}</td></tr>`)
          .join('');

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fromEmail,
            to: [adminEmail],
            subject: `【BRUX NeoForm】新規${answers.inquiry_type || 'お問い合わせ'}：${answers.company_name || '名称未記入'}`,
            html: `
              <div style="font-family:'Hiragino Sans','Noto Sans JP',sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#0a1628;color:white;padding:20px 24px;">
                  <h2 style="margin:0;font-size:16px;">新規お問い合わせ通知</h2>
                </div>
                <div style="padding:24px;">
                  <table style="width:100%;border-collapse:collapse;">${answersHtml}</table>
                  <p style="margin-top:20px;font-size:12px;color:#999;">送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
                </div>
              </div>
            `,
          }),
        });

        // 自動返信メール（メールアドレスがある場合）
        if (answers.email) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: fromEmail,
              to: [answers.email],
              subject: '【ブルックスジャパン】お問い合わせありがとうございます',
              html: `
                <div style="font-family:'Hiragino Sans','Noto Sans JP',sans-serif;max-width:600px;margin:0 auto;">
                  <div style="background:#0a1628;color:white;padding:20px 24px;">
                    <h2 style="margin:0;font-size:16px;">お問い合わせ受付のご連絡</h2>
                  </div>
                  <div style="padding:24px;line-height:1.8;font-size:14px;">
                    <p>${answers.contact_name || 'お客'}様</p>
                    <p>この度はブルックスジャパンへお問い合わせいただき、誠にありがとうございます。</p>
                    <p>内容を確認の上、担当者より<strong>2営業日以内</strong>にご連絡させていただきます。</p>
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
                    <p style="font-size:12px;color:#999;">
                      株式会社ブルックスジャパン<br>
                      TEL: 092-473-6455<br>
                      https://www.brux.jp
                    </p>
                  </div>
                </div>
              `,
            }),
          });
        }

        // メール送信成功をDB更新
        await supabaseAdmin.from('submissions').update({ status: 'sent' }).eq('id', submission.id);

      } catch (emailErr) {
        console.error('Email send error:', emailErr);
        await supabaseAdmin.from('submissions').update({ status: 'email_failed' }).eq('id', submission.id);
      }
    }

    return NextResponse.json({ success: true, id: submission.id });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// スパムログ記録
async function logSpam(formId: string, reason: string, req: NextRequest) {
  try {
    await supabaseAdmin.from('spam_logs').insert({
      form_id: formId,
      reason,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || '',
    });
  } catch {}
}

// レート制限チェック
async function checkRateLimit(formId: string, ip: string): Promise<boolean> {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', formId)
      .eq('ip_address', ip)
      .gte('created_at', oneMinuteAgo);
    return (count || 0) < 3;
  } catch {
    return true;
  }
}
