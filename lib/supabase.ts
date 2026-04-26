import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// クライアントサイド用
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サーバーサイド用（API Routes で使用）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

export type FormField = {
  id: string;
  form_id: string;
  field_type: 'text' | 'email' | 'tel' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'rating' | 'heading' | 'description';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  sort_order: number;
  group_name?: string;
};

export type FormConfig = {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  thank_you_message?: string;
  notify_emails: string[];
  auto_reply_subject?: string;
  auto_reply_body?: string;
  fields: FormField[];
  downloadable_files?: { id: string; filename: string; url: string; description: string }[];
};
