'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

// ============================================================
// フォーム定義 - brux.jp 完全再現
// ============================================================
type FieldDef = {
  id: string;
  field_type: 'text' | 'email' | 'tel' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'rating' | 'email_confirm';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  step: string;
  sort_order: number;
};

type FormDef = {
  id: string;
  name: string;
  description: string;
  thank_you_message: string;
  steps: { id: string; label: string }[];
  fields: FieldDef[];
};

// ========== 共通フィールド（お客様情報） ==========
const COMPANY_FIELDS: FieldDef[] = [
  { id: 'company_name', field_type: 'text', label: '会社名', placeholder: '例：株式会社○○', required: true, sort_order: 1, step: 'info' },
  { id: 'company_kana', field_type: 'text', label: '会社名（カナ）', placeholder: '例：カブシキガイシャ○○', required: true, sort_order: 2, step: 'info' },
  { id: 'department', field_type: 'text', label: '部署名', placeholder: '例：製造部', required: false, sort_order: 3, step: 'info' },
  { id: 'contact_name', field_type: 'text', label: '担当者様名', placeholder: '例：山田太郎', required: true, sort_order: 4, step: 'info' },
  { id: 'contact_kana', field_type: 'text', label: '担当者様名（カナ）', placeholder: '例：ヤマダタロウ', required: true, sort_order: 5, step: 'info' },
  { id: 'email', field_type: 'email', label: '担当者様メールアドレス', placeholder: '例：info@example.co.jp', required: true, sort_order: 6, step: 'info' },
  { id: 'email_confirm', field_type: 'email_confirm', label: '担当者様メールアドレス（確認）', placeholder: '確認のため再度入力してください', required: true, sort_order: 7, step: 'info' },
  { id: 'phone', field_type: 'tel', label: '電話番号', placeholder: '例：092-473-6455', required: true, sort_order: 8, step: 'info' },
];

// ========== フォーム① 資料請求 ==========
const FORM_REQUEST: FormDef = {
  id: 'request',
  name: '資料請求',
  description: '株式会社ブルックスジャパンへの資料請求フォームです。',
  thank_you_message: '資料請求ありがとうございます。ご希望のカタログを担当者よりお送りいたします。',
  steps: [
    { id: 'info', label: 'お客様情報' },
    { id: 'catalog', label: 'カタログ選択' },
    { id: 'confirm', label: '確認' },
  ],
  fields: [
    ...COMPANY_FIELDS,
    { id: 'catalog', field_type: 'checkbox', label: '希望カタログ', required: true, sort_order: 10, step: 'catalog',
      options: [
        'TeknekハンドローラーTek-HR',
        'Teknek SMT基板クリーナー Tek-BCシリーズ',
        'Teknek シートクリーナー',
        'Teknek ウェブクリーナー（リールtoリール用）',
        'Teknek 総合カタログ',
        'LPKF メタルマスクレーザー加工機P6060 / G6080 / MicroCut6080',
        'LPKF 精密金属部品レーザー加工機 PowerCut6080',
        'LPKF エアーテンションフレーム',
        'ステンレスシート',
        'Aerocomエアチューブシステム気送管搬送装置',
        'PROTECエンジニアリング製品',
      ] },
    { id: 'message', field_type: 'textarea', label: 'お問い合わせ内容', placeholder: 'カタログに関するご質問等があればご記入ください', required: false, sort_order: 11, step: 'catalog' },
  ],
};

// ========== フォーム② お問い合わせ ==========
const FORM_CONTACT: FormDef = {
  id: 'contact',
  name: 'お問い合わせ',
  description: '株式会社ブルックスジャパンへのお問い合わせフォームです。',
  thank_you_message: 'お問い合わせありがとうございます。担当者より2営業日以内にご連絡いたします。',
  steps: [
    { id: 'info', label: 'お客様情報' },
    { id: 'detail', label: 'お問い合わせ内容' },
    { id: 'confirm', label: '確認' },
  ],
  fields: [
    ...COMPANY_FIELDS,
    { id: 'message', field_type: 'textarea', label: 'お問い合わせ内容', placeholder: 'お問い合わせ内容をご記入ください', required: true, sort_order: 10, step: 'detail' },
  ],
};

// ========== デモフォーム ==========
const FORM_DEMO: FormDef = {
  ...FORM_REQUEST,
  id: 'demo',
  name: '資料請求・お問い合わせ',
  description: '資料請求、もしくはお問い合わせをお選びいただき項目ご記入後お送りください。',
};

const FORMS: Record<string, FormDef> = {
  request: FORM_REQUEST,
  contact: FORM_CONTACT,
  demo: FORM_DEMO,
};

const FIELD_LABELS: Record<string, string> = {
  company_name: '会社名', company_kana: '会社名（カナ）', department: '部署名',
  contact_name: '担当者様名', contact_kana: '担当者様名（カナ）',
  email: 'メールアドレス', email_confirm: 'メールアドレス（確認）', phone: '電話番号',
  catalog: '希望カタログ', message: 'お問い合わせ内容', inquiry_type: 'お問い合わせ種別',
};

// ============================================================
// メインコンポーネント
// ============================================================
export default function FormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = (params?.formId as string) || 'demo';
  const isEmbed = searchParams?.get('embed') === '1';

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [startTime] = useState(Date.now());
  const [agreed, setAgreed] = useState(false);

  const form = FORMS[formId] || FORM_DEMO;
  const steps = form.steps;
  const stepFields = form.fields.filter(f => f.step === steps[currentStep]?.id);

  // iframe高さ通知
  useEffect(() => {
    if (isEmbed) {
      const notifyHeight = () => {
        parent.postMessage({ type: 'brux-neoform-resize', height: document.body.scrollHeight }, '*');
      };
      notifyHeight();
      const observer = new MutationObserver(notifyHeight);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      return () => observer.disconnect();
    }
  }, [isEmbed, currentStep, submitted]);

  // 離脱追跡
  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_id: formId, event_type: 'step_view', step: currentStep }),
    }).catch(() => {});
  }, [currentStep, formId]);

  const updateField = useCallback((id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (currentStep === steps.length - 1) { setErrors({}); return true; }

    stepFields.forEach(f => {
      if (f.required) {
        const val = formData[f.id];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim())) {
          newErrors[f.id] = '必須項目です';
        }
      }
      if (f.field_type === 'email' && formData[f.id]) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[f.id])) {
          newErrors[f.id] = '正しいメールアドレスを入力してください';
        }
      }
      if (f.field_type === 'email_confirm') {
        if (formData[f.id] !== formData['email']) {
          newErrors[f.id] = 'メールアドレスが一致しません';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => { if (validateStep()) setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)); };
  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (honeypot) return;
    if (Date.now() - startTime < 3000) return;
    if (!agreed) { alert('プライバシーポリシーに同意してください'); return; }

    setSubmitting(true);
    try {
      const submitData = { ...formData };
      delete submitData.email_confirm;
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: formId, answers: submitData, honeypot, elapsed_ms: Date.now() - startTime }),
      });
      if (res.ok) setSubmitted(true);
      else { const data = await res.json(); alert(data.error || '送信に失敗しました。'); }
    } catch { alert('通信エラーが発生しました。'); }
    finally { setSubmitting(false); }
  };

  // === 送信完了 ===
  if (submitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isEmbed ? 'bg-transparent p-4' : 'bg-brux-bg p-6'}`}>
        <div className="bg-white rounded-2xl p-12 max-w-lg w-full text-center border border-brux-line shadow-sm animate-fade-in">
          <div className="w-16 h-16 bg-brux-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brux-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-3">送信完了</h2>
          <p className="text-sm text-brux-gray leading-relaxed">{form.thank_you_message}</p>
          {!isEmbed && (
            <a href="https://www.brux.jp" className="inline-block mt-8 btn-secondary">ブルックスジャパン トップへ戻る</a>
          )}
        </div>
      </div>
    );
  }

  const isConfirmStep = currentStep === steps.length - 1;

  return (
    <div className={`min-h-screen ${isEmbed ? 'bg-transparent' : 'bg-brux-bg'}`}>
      <div className={`max-w-2xl mx-auto ${isEmbed ? 'p-4' : 'px-6 py-10 md:py-16'}`}>

        {/* ヘッダー */}
        {!isEmbed && (
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-6 h-[2px] bg-brux-accent" />
              <span className="text-[10px] tracking-[0.3em] text-brux-accent font-bold uppercase">BRUX JAPAN</span>
              <div className="w-6 h-[2px] bg-brux-accent" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{form.name}</h1>
            <p className="text-sm text-brux-gray mt-2">{form.description}</p>

            {/* 資料請求 / お問い合わせ 切り替えボタン */}
            <div className="flex justify-center gap-4 mt-6">
              <a href="/form/request"
                className={`px-8 py-3 text-sm font-medium rounded-lg transition-all ${
                  formId === 'request' || formId === 'demo'
                    ? 'bg-brux-navy text-white' : 'border border-brux-line text-brux-gray hover:bg-brux-light'}`}>
                資料請求
              </a>
              <a href="/form/contact"
                className={`px-8 py-3 text-sm font-medium rounded-lg transition-all ${
                  formId === 'contact'
                    ? 'bg-brux-accent text-white' : 'border border-brux-line text-brux-gray hover:bg-brux-light'}`}>
                お問い合わせ
              </a>
            </div>
          </div>
        )}

        {/* ステッププログレス */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button onClick={() => i < currentStep && setCurrentStep(i)}
                className={`step-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : 'pending'}`}>
                {i < currentStep ? '✓' : i + 1}
              </button>
              <span className={`text-xs hidden md:block ${i === currentStep ? 'text-brux-accent font-bold' : 'text-brux-gray'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className={`w-8 h-[2px] ${i < currentStep ? 'bg-brux-success' : 'bg-brux-line'}`} />}
            </div>
          ))}
        </div>

        {/* フォーム本体 */}
        <div className="bg-white rounded-2xl border border-brux-line shadow-sm p-8 md:p-10">
          <input type="text" name="website_url" value={honeypot} onChange={e => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }} tabIndex={-1} autoComplete="off" />

          {isConfirmStep ? (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-brux-accent/10 rounded flex items-center justify-center text-brux-accent text-xs">✓</span>
                入力内容のご確認
              </h2>
              <div className="space-y-4">
                {form.fields
                  .filter(f => f.field_type !== 'email_confirm' && formData[f.id] != null && formData[f.id] !== '')
                  .map(f => (
                    <div key={f.id} className="flex border-b border-brux-line/50 pb-3">
                      <span className="text-xs text-brux-gray w-40 shrink-0 pt-0.5">{FIELD_LABELS[f.id] || f.label}</span>
                      <span className="text-sm font-medium break-all">
                        {Array.isArray(formData[f.id]) ? formData[f.id].join('、') : String(formData[f.id])}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="mt-8 p-4 bg-brux-bg rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-brux-line accent-brux-accent" />
                  <span className="text-xs text-brux-gray leading-relaxed">
                    <a href="https://www.brux.jp/privacy" target="_blank" rel="noopener noreferrer"
                      className="text-brux-accent underline">プライバシーポリシー</a>に同意の上、送信してください。
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-lg font-bold mb-2 text-brux-navy">{steps[currentStep]?.label}</h2>
              {stepFields.map((field, idx) => (
                <div key={field.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <FieldRenderer field={field} value={formData[field.id]} emailValue={formData['email']}
                    error={errors[field.id]} onChange={(val: any) => updateField(field.id, val)} />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-10 pt-6 border-t border-brux-line/50">
            {currentStep > 0 ? <button onClick={goBack} className="btn-secondary">← 戻る</button> : <div />}
            {isConfirmStep ? (
              <button onClick={handleSubmit} disabled={submitting || !agreed} className="btn-primary">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />送信中...
                  </span>
                ) : '送信する'}
              </button>
            ) : (
              <button onClick={goNext} className="btn-primary">次へ →</button>
            )}
          </div>
        </div>

        {!isEmbed && (
          <p className="text-center text-[10px] text-brux-gray mt-8">Powered by NeoForm — 高到達率メールフォームシステム</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// フィールドレンダラー
// ============================================================
function FieldRenderer({ field, value, emailValue, error, onChange }: {
  field: FieldDef; value: any; emailValue?: string; error?: string; onChange: (v: any) => void;
}) {
  const labelEl = (
    <label className="block text-sm font-medium mb-2">
      {field.label}
      {field.required && <span className="required-badge">必須</span>}
    </label>
  );

  switch (field.field_type) {
    case 'text': case 'email': case 'tel':
      return (<div>{labelEl}
        <input type={field.field_type} value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder} className={`form-input ${error ? 'error' : ''}`} />
        {error && <p className="text-xs text-brux-error mt-1">{error}</p>}</div>);

    case 'email_confirm':
      return (<div>{labelEl}
        <input type="email" value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder} className={`form-input ${error ? 'error' : ''}`} />
        {error && <p className="text-xs text-brux-error mt-1">{error}</p>}
        {value && emailValue && value === emailValue && (
          <p className="text-xs text-brux-success mt-1">✓ メールアドレスが一致しています</p>
        )}</div>);

    case 'textarea':
      return (<div>{labelEl}
        <textarea value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder} rows={5} className={`form-input resize-none ${error ? 'error' : ''}`} />
        {error && <p className="text-xs text-brux-error mt-1">{error}</p>}</div>);

    case 'radio':
      return (<div>{labelEl}
        <div className="space-y-2">
          {field.options?.map(opt => (
            <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
              ${value === opt ? 'border-brux-accent bg-brux-accent/5' : 'border-brux-line hover:border-brux-accent/40'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                ${value === opt ? 'border-brux-accent' : 'border-brux-line'}`}>
                {value === opt && <div className="w-2.5 h-2.5 bg-brux-accent rounded-full" />}
              </div>
              <span className="text-sm">{opt}</span>
            </label>))}
        </div>
        {error && <p className="text-xs text-brux-error mt-1">{error}</p>}</div>);

    case 'checkbox':
      const selected: string[] = value || [];
      const toggle = (opt: string) => {
        onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
      };
      return (<div>{labelEl}
        <div className="space-y-2">
          {field.options?.map(opt => (
            <label key={opt} onClick={() => toggle(opt)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
              ${selected.includes(opt) ? 'border-brux-accent bg-brux-accent/5' : 'border-brux-line hover:border-brux-accent/40'}`}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0
                ${selected.includes(opt) ? 'bg-brux-accent border-brux-accent' : 'border-brux-line'}`}>
                {selected.includes(opt) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>)}
              </div>
              <span className="text-sm">{opt}</span>
            </label>))}
        </div>
        {error && <p className="text-xs text-brux-error mt-1">{error}</p>}</div>);

    case 'rating':
      const rating = value || 0;
      return (<div>{labelEl}
        <div className="flex gap-2">
          {[1,2,3,4,5].map(star => (
            <button key={star} type="button" onClick={() => onChange(star)}
              className={`w-10 h-10 rounded-lg border text-lg transition-all ${star <= rating
                ? 'bg-brux-warn border-brux-warn text-white' : 'border-brux-line text-brux-line hover:border-brux-warn/40'}`}>★</button>))}
        </div></div>);

    default: return null;
  }
}
