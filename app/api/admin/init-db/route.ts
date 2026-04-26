import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // テーブル作成（RPC経由でSQL実行）
    const tables = [
      `CREATE TABLE IF NOT EXISTS submissions (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        form_id text NOT NULL DEFAULT 'demo',
        email text,
        name text,
        answers jsonb NOT NULL DEFAULT '{}',
        ip_address text,
        user_agent text,
        status text DEFAULT 'received',
        created_at timestamptz DEFAULT now()
      )`,
      `CREATE TABLE IF NOT EXISTS form_events (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        form_id text NOT NULL DEFAULT 'demo',
        event_type text NOT NULL,
        field_id text,
        step_index int,
        ip_address text,
        user_agent text,
        created_at timestamptz DEFAULT now()
      )`,
      `CREATE TABLE IF NOT EXISTS spam_logs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        form_id text NOT NULL DEFAULT 'demo',
        reason text NOT NULL,
        ip_address text,
        user_agent text,
        created_at timestamptz DEFAULT now()
      )`,
      `CREATE TABLE IF NOT EXISTS download_logs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        form_id text NOT NULL DEFAULT 'demo',
        file_id text NOT NULL,
        filename text,
        submission_id uuid,
        ip_address text,
        created_at timestamptz DEFAULT now()
      )`,
    ];

    const results: string[] = [];

    for (const sql of tables) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { query: sql }).single();
      if (error) {
        // rpcが使えない場合は直接テーブル作成を試行
        // Supabase Dashboardから手動でSQLを実行する必要がある
        results.push(`注意: ${error.message}`);
      } else {
        results.push('OK');
      }
    }

    // RPC使えない場合のフォールバック：テーブルの存在確認
    const { data: testData, error: testErr } = await supabaseAdmin
      .from('submissions').select('id').limit(1);

    if (testErr && testErr.code === '42P01') {
      // テーブルが存在しない
      return NextResponse.json({
        success: false,
        message: 'テーブルが存在しません。Supabase SQL EditorからSQLを手動実行してください。',
        sql: tables.join(';\n\n'),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'データベース接続OK',
      tables_exist: !testErr,
      results,
    });
  } catch (err) {
    console.error('Init DB error:', err);
    return NextResponse.json({ error: 'DB初期化エラー' }, { status: 500 });
  }
}
