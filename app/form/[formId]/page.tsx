'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

// ============================================================
// デモ用フォーム定義（BRUX Japan向け）
// ============================================================
const DEMO_FORM = {
  id: 'demo',
  name: '資料請求・お問い合わせ',
  description: '株式会社ブルックスジャパンへの資料請求・お問い合わせフォームです。',
  thank_you_message: 'お問い合わせありがとうございます。担当者より2営業日以内にご連絡いたします。',
  steps: [
    { id: 'type', label: 'お問い合わせ種別' },
    { id: 'company', label: 'お客様情報' },
    { id: 'survey', label: 'アンケート' },
    { id: 'confirm', label: '確認' },
  ],
  fields: [
    // === Step 1: 種別 ===
    { id: 'inquiry_type', field_type: 'radio', label: 'お問い合わせ種別', required: true, sort_order: 1, step: 'type',
      options: ['資料請求', 'お見積もり依頼', '製品に関するお問い合わせ', 'その他'] },
    { id: 'catalog', field_type: 'checkbox', label: 'ご希望カタログ（資料請求の場合）', required: false, sort_order: 2, step: 'type',
      options: ['Teknekハンドローラー Tek-HR', 'Teknek SMT基板クリーナー Tek-BCシリーズ', 'Teknekシートクリーナー', 'Teknekウェブクリーナー（リールtoリール用）', 'Teknek総合カタログ', 'LPKFレーザー装置カタログ', 'メタルマスク用ステンレスシート', 'Aerocomエアチューブシステム'] },
    // === Step 2: 会社情報 ===
    { id: 'company_name', field_type: 'text', label: '会社名', placeholder: '例：株式会社○○', required: true, sort_order: 10, step: 'company' },
    { id: 'company_kana', field_type: 'text', label: '会社名（カナ）', placeholder: '例：カブシキガイシャ○○', required: true, sort_order: 11, step: 'company' },
    { id: 'department', field_type: 'text', label: '部署名', placeholder: '例：製造部', required: false, sort_order: 12, step: 'company' },
    { id: 'contact_name', field_type: 'text', label: 'ご担当者名', placeholder: '例：山田太郎', required: true, sort_order: 13, step: 'company' },
    { id: 'contact_kana', field_type: 'text', label: 'ご担当者名（カナ）', placeholder: '例：ヤマダタロウ', required: true, sort_order: 14, step: 'company' },
    { id: 'email', field_type: 'email', label: 'メールアドレス', placeholder: '例：info@example.co.jp', required: true, sort_order: 15, step: 'company' },
    { id: 'phone', field_type: 'tel', label: '電話番号', placeholder: '例：092-473-6455', required: true, sort_order: 16, step: 'company' },
    { id: 'message', field_type: 'textarea', label: 'お問い合わせ内容', placeholder: 'ご質問やご要望をご記入ください', required: false, sort_order: 17, step: 'company' },
    // === Step 3: アンケート ===
    { id: 'how_found', field_type: 'radio', label: '弊社を何でお知りになりましたか？', required: false, sort_order: 20, step: 'survey',
      options: ['Google検索', '展示会', '業界誌・専門誌', '知人・取引先の紹介', 'SNS', 'その他'] },
    { id: 'interest_products', field_type: 'checkbox', label: '関心のある製品カテゴリ（複数選択可）', required: false, sort_order: 21, step: 'survey',
      options: ['コンタクトクリーニング', 'レーザー装置', 'メタルマスク関連', 'エアチューブシステム', '輸出入代行'] },
    { id: 'satisfaction', field_type: 'rating', label: '現在お使いの類似製品への満足度', required: false, sort_order: 22, step: 'survey' },
    { id: 'feedback', field_type: 'textarea', label: '製品選定にあたってのご要望・課題', placeholder: '自由にご記入ください', required: false, sort_order: 23, step: 'survey' },
  ],
};

type FieldDef = typeof DEMO_FORM.fields[number];

export default function FormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = params?.formId as string || 'demo';
  const isEmbed = searchParams?.get('embed') === '1';

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [startTime] = useState(Date.now());

  const form = DEMO_FORM;
  const steps = form.steps;
  const stepFields = form.fields.filter(f => f.step === steps[currentStep]?.id);

  // 離脱追跡
  useEffect(() => {
    const trackEvent = (eventType: string, fieldId?: string) => {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: formId, event_type: eventType, field_id: fieldId, step: currentStep }),
      }).catch(() => {});
    };
    trackEvent('step_view');

    const handleBeforeUnload = () => trackEvent('page_leave');
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep, formId]);

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

  const updateField = useCallback((id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = currentStep < steps.length - 1 ? stepFields : [];

    fieldsToValidate.forEach(f => {
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
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep()) setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };
  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (honeypot) return; // スパム
    if (Date.now() - startTime < 3000) return; // 高速送信ブロック

    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: formId,
          answers: formData,
          honeypot,
          elapsed_ms: Date.now() - startTime,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || '送信に失敗しました。時間をおいてお試しください。');
      }
    } catch {
      alert('通信エラーが発生しました。');
    } finally {
      setSubmitting(false);
    }
  };

  // === 送信完了画面 ===
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
            <a href="https://www.brux.jp" className="inline-block mt-8 btn-secondary">
              ブルックスジャパン トップへ戻る
            </a>
          )}
        </div>
      </div>
    );
  }

  // === 確認ステップ ===
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
          </div>
        )}

        {/* ステッププログレス */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => i < currentStep && setCurrentStep(i)}
                className={`step-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : 'pending'}`}
              >
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

          {/* ハニーポット */}
          <input
            type="text"
            name="website_url"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
            tabIndex={-1}
            autoComplete="off"
          />

          {isConfirmStep ? (
            /* === 確認画面 === */
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-brux-accent/10 rounded flex items-center justify-center text-brux-accent text-xs">✓</span>
                入力内容のご確認
              </h2>
              <div className="space-y-4">
                {form.fields.filter(f => formData[f.id] && f.field_type !== 'heading' && f.field_type !== 'description').map(f => (
                  <div key={f.id} className="flex border-b border-brux-line/50 pb-3">
                    <span className="text-xs text-brux-gray w-40 shrink-0 pt-0.5">{f.label}</span>
                    <span className="text-sm font-medium">
                      {Array.isArray(formData[f.id]) ? formData[f.id].join('、') :
                       f.field_type === 'rating' ? `${'★'.repeat(formData[f.id])}${'☆'.repeat(5 - formData[f.id])}` :
                       formData[f.id]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* === 入力フィールド === */
            <div className="space-y-6">
              <h2 className="text-lg font-bold mb-2 text-brux-navy">
                {steps[currentStep]?.label}
              </h2>
              {stepFields.map((field, idx) => (
                <div key={field.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <FieldRenderer
                    field={field}
                    value={formData[field.id]}
                    error={errors[field.id]}
                    onChange={(val: any) => updateField(field.id, val)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex justify-between mt-10 pt-6 border-t border-brux-line/50">
            {currentStep > 0 ? (
              <button onClick={goBack} className="btn-secondary">← 戻る</button>
            ) : <div />}

            {isConfirmStep ? (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    送信中...
                  </span>
                ) : '送信する →'}
              </button>
            ) : (
              <button onClick={goNext} className="btn-primary">次へ →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// フィールドレンダラー
// ============================================================
function FieldRenderer({ field, value, error, onChange }: {
  field: FieldDef; value: any; error?: string; onChange: (v: any) => void;
}) {
  const labelEl = (
    <label className="block text-sm font-medium mb-2">
      {field.label}
      {field.required && <span className="required-badge">必須</span>}
    </label>
  );

  switch (field.field_type) {
    case 'text':
    case 'email':
    case 'tel':
      return (
        <div>
          {labelEl}
          <input
            type={field.field_type}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`form-input ${error ? 'error' : ''}`}
          />
          {error && <p className="text-xs text-brux-error mt-1">{error}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div>
          {labelEl}
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`form-input resize-none ${error ? 'error' : ''}`}
          />
          {error && <p className="text-xs text-brux-error mt-1">{error}</p>}
        </div>
      );

    case 'radio':
      return (
        <div>
          {labelEl}
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${value === opt ? 'border-brux-accent bg-brux-accent/5' : 'border-brux-line hover:border-brux-accent/40'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                  ${value === opt ? 'border-brux-accent' : 'border-brux-line'}`}>
                  {value === opt && <div className="w-2.5 h-2.5 bg-brux-accent rounded-full" />}
                </div>
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-brux-error mt-1">{error}</p>}
        </div>
      );

    case 'checkbox':
      const selected: string[] = value || [];
      return (
        <div>
          {labelEl}
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${selected.includes(opt) ? 'border-brux-accent bg-brux-accent/5' : 'border-brux-line hover:border-brux-accent/40'}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0
                  ${selected.includes(opt) ? 'bg-brux-accent border-brux-accent' : 'border-brux-line'}`}>
                  {selected.includes(opt) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-brux-error mt-1">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div>
          {labelEl}
          <select value={value || ''} onChange={e => onChange(e.target.value)}
            className={`form-input ${error ? 'error' : ''}`}>
            <option value="">選択してください</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {error && <p className="text-xs text-brux-error mt-1">{error}</p>}
        </div>
      );

    case 'rating':
      const rating = value || 0;
      return (
        <div>
          {labelEl}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} type="button" onClick={() => onChange(star)}
                className={`w-10 h-10 rounded-lg border text-lg transition-all ${star <= rating
                  ? 'bg-brux-warn border-brux-warn text-white' : 'border-brux-line text-brux-line hover:border-brux-warn/40'}`}>
                ★
              </button>
            ))}
            {rating > 0 && <span className="text-sm text-brux-gray self-center ml-2">{rating}/5</span>}
          </div>
        </div>
      );

    default:
      return null;
  }
}
