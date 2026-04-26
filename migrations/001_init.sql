-- =============================================
-- BRUX NeoForm - Database Schema
-- Supabase SQL Editor で実行してください
-- =============================================

-- 送信データ
CREATE TABLE IF NOT EXISTS submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id text NOT NULL DEFAULT 'demo',
  email text,
  name text,
  answers jsonb NOT NULL DEFAULT '{}',
  ip_address text,
  user_agent text,
  status text DEFAULT 'received',
  created_at timestamptz DEFAULT now()
);

-- フォームイベント（離脱追跡）
CREATE TABLE IF NOT EXISTS form_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id text NOT NULL DEFAULT 'demo',
  event_type text NOT NULL,
  field_id text,
  step_index int,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- スパムログ
CREATE TABLE IF NOT EXISTS spam_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id text NOT NULL DEFAULT 'demo',
  reason text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ダウンロードログ
CREATE TABLE IF NOT EXISTS download_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id text NOT NULL DEFAULT 'demo',
  file_id text NOT NULL,
  filename text,
  submission_id uuid REFERENCES submissions(id),
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_events_form_id ON form_events(form_id);
CREATE INDEX IF NOT EXISTS idx_spam_logs_form_id ON spam_logs(form_id);

-- RLS ポリシー設定
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spam_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

-- API（anon）からの書き込みを許可
CREATE POLICY "Allow insert submissions" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read submissions" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Allow update submissions" ON submissions
  FOR UPDATE USING (true);

CREATE POLICY "Allow insert form_events" ON form_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read form_events" ON form_events
  FOR SELECT USING (true);

CREATE POLICY "Allow insert spam_logs" ON spam_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read spam_logs" ON spam_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow insert download_logs" ON download_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read download_logs" ON download_logs
  FOR SELECT USING (true);
