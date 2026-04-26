'use client';
import { useState, useEffect, useCallback } from 'react';

type Tab = 'stats' | 'submissions' | 'survey' | 'downloads' | 'settings';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState<Tab>('stats');

  const login = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('パスワードが違います');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-brux-bg flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 w-full max-w-sm border border-brux-line shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-brux-navy rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold">管理画面ログイン</h1>
            <p className="text-xs text-brux-gray mt-1">BRUX NeoForm Admin</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="管理パスワード"
            className="form-input mb-4"
          />
          {authError && <p className="text-xs text-brux-error mb-3">{authError}</p>}
          <button onClick={login} className="btn-primary w-full">ログイン</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brux-bg">
      {/* ヘッダー */}
      <header className="bg-white border-b border-brux-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brux-navy rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <div>
              <h1 className="text-sm font-bold">BRUX NeoForm</h1>
              <p className="text-[10px] text-brux-gray">管理ダッシュボード</p>
            </div>
          </div>
          <button onClick={() => setAuthed(false)} className="text-xs text-brux-gray hover:text-brux-error transition-colors">
            ログアウト
          </button>
        </div>
      </header>

      {/* タブ */}
      <div className="bg-white border-b border-brux-line">
        <div className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {([
            { id: 'stats', label: '📊 統計' },
            { id: 'submissions', label: '📋 送信一覧' },
            { id: 'survey', label: '📝 アンケート集計' },
            { id: 'downloads', label: '📥 DL統計' },
            { id: 'settings', label: '⚙️ 設定' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'stats' && <StatsPanel />}
        {tab === 'submissions' && <SubmissionsPanel />}
        {tab === 'survey' && <SurveyPanel />}
        {tab === 'downloads' && <DownloadsPanel />}
        {tab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}

// ============================================================
// 統計パネル
// ============================================================
function StatsPanel() {
  const [stats, setStats] = useState<any>(null);
  const [dlStats, setDlStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats?form_id=request').then(r => r.json()),
      fetch('/api/download-log?form_id=request').then(r => r.json()),
    ]).then(([s, d]) => { setStats(s); setDlStats(d); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <p className="text-brux-gray text-sm">データの読み込みに失敗しました</p>;

  const cards = [
    { label: '総送信数', value: stats.totalSubmissions, color: 'bg-brux-accent' },
    { label: '今日の送信', value: stats.todaySubmissions, color: 'bg-brux-success' },
    { label: 'メール送信成功', value: stats.emailsSent, color: 'bg-blue-500' },
    { label: '資料DL数', value: dlStats?.totalDownloads || 0, color: 'bg-amber-500' },
    { label: 'スパムブロック', value: stats.spamBlocked, color: 'bg-brux-error' },
  ];

  const dailyEntries = Object.entries(stats.dailyCounts || {});
  const maxDaily = Math.max(...dailyEntries.map(([, v]) => v as number), 1);

  return (
    <div className="space-y-8">
      {/* カード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-brux-line p-6">
            <p className="text-xs text-brux-gray mb-1">{c.label}</p>
            <p className="text-3xl font-bold">{c.value}</p>
            <div className={`w-8 h-1 ${c.color} rounded mt-3`} />
          </div>
        ))}
      </div>

      {/* メール到達率 */}
      <div className="bg-white rounded-xl border border-brux-line p-6">
        <h3 className="text-sm font-bold mb-4">メール到達率</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-brux-success">{stats.deliveryRate}%</div>
          <div className="flex-1">
            <div className="h-3 bg-brux-light rounded-full overflow-hidden">
              <div className="h-full bg-brux-success rounded-full transition-all duration-1000"
                style={{ width: `${stats.deliveryRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 日別グラフ */}
      <div className="bg-white rounded-xl border border-brux-line p-6">
        <h3 className="text-sm font-bold mb-6">直近7日間の送信数</h3>
        <div className="flex items-end gap-3 h-40">
          {dailyEntries.map(([date, count]) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-brux-accent">{count as number}</span>
              <div className="w-full bg-brux-accent/20 rounded-t relative" style={{ height: `${Math.max(((count as number) / maxDaily) * 100, 4)}%` }}>
                <div className="absolute inset-0 bg-brux-accent rounded-t" />
              </div>
              <span className="text-[10px] text-brux-gray">{date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ステップ離脱 */}
      {stats.stepViews && Object.keys(stats.stepViews).length > 0 && (
        <div className="bg-white rounded-xl border border-brux-line p-6">
          <h3 className="text-sm font-bold mb-4">ステップ別閲覧数（ファネル）</h3>
          <div className="space-y-3">
            {['お問い合わせ種別', 'お客様情報', 'アンケート', '確認'].map((label, i) => {
              const views = stats.stepViews[i] || 0;
              const maxViews = stats.stepViews[0] || 1;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-brux-gray w-28 shrink-0">Step {i + 1}: {label}</span>
                  <div className="flex-1 h-6 bg-brux-light rounded overflow-hidden">
                    <div className="h-full bg-brux-accent/70 rounded flex items-center px-2"
                      style={{ width: `${(views / maxViews) * 100}%` }}>
                      <span className="text-[10px] text-white font-bold">{views}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 送信一覧パネル
// ============================================================
function SubmissionsPanel() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetchData = useCallback((p: number) => {
    setLoading(true);
    fetch(`/api/admin/submissions?form_id=demo&page=${p}`)
      .then(r => r.json()).then(d => { setData(d); setPage(p); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(1); }, [fetchData]);

  if (loading && !data) return <LoadingSpinner />;

  const statusColor: Record<string, string> = {
    sent: 'bg-brux-success/10 text-brux-success',
    received: 'bg-brux-warn/10 text-brux-warn',
    email_failed: 'bg-brux-error/10 text-brux-error',
  };

  // CSV出力
  const exportCSV = () => {
    if (!data?.submissions?.length) return;
    const allKeys = new Set<string>();
    data.submissions.forEach((s: any) => Object.keys(s.answers || {}).forEach(k => allKeys.add(k)));
    const keys = Array.from(allKeys);
    const header = ['日時', 'ステータス', ...keys].join(',');
    const rows = data.submissions.map((s: any) => {
      const dt = new Date(s.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      return [dt, s.status, ...keys.map(k => {
        const v = s.answers?.[k];
        return `"${Array.isArray(v) ? v.join('|') : (v || '')}"`;
      })].join(',');
    });
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `brux-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">送信一覧 ({data?.total || 0}件)</h2>
        <button onClick={exportCSV} className="btn-secondary text-xs">📥 CSV出力</button>
      </div>

      {/* 詳細モーダル */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold">送信詳細</h3>
              <button onClick={() => setSelected(null)} className="text-brux-gray hover:text-brux-error text-lg">✕</button>
            </div>
            <p className="text-xs text-brux-gray mb-4">
              {new Date(selected.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
            </p>
            <div className="space-y-3">
              {Object.entries(selected.answers || {}).map(([key, val]) => (
                <div key={key} className="flex border-b border-brux-line/50 pb-2">
                  <span className="text-xs text-brux-gray w-36 shrink-0">{key}</span>
                  <span className="text-sm">{Array.isArray(val) ? (val as string[]).join('、') : String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* テーブル */}
      <div className="bg-white rounded-xl border border-brux-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brux-bg">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-brux-gray font-medium">日時</th>
                <th className="text-left px-4 py-3 text-xs text-brux-gray font-medium">会社名</th>
                <th className="text-left px-4 py-3 text-xs text-brux-gray font-medium">担当者</th>
                <th className="text-left px-4 py-3 text-xs text-brux-gray font-medium">種別</th>
                <th className="text-left px-4 py-3 text-xs text-brux-gray font-medium">ステータス</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.submissions?.map((s: any) => (
                <tr key={s.id} className="border-t border-brux-line/50 hover:bg-brux-bg/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-brux-gray whitespace-nowrap">
                    {new Date(s.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{s.answers?.company_name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{s.answers?.contact_name || '-'}</td>
                  <td className="px-4 py-3 text-xs">{s.answers?.inquiry_type || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor[s.status] || 'bg-brux-light text-brux-gray'}`}>
                      {s.status === 'sent' ? '送信済' : s.status === 'received' ? '受信済' : 'メール失敗'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(s)} className="text-xs text-brux-accent hover:underline">詳細</button>
                  </td>
                </tr>
              ))}
              {(!data?.submissions || data.submissions.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-brux-gray text-sm">送信データがありません</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {data && data.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-brux-line/50">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchData(p)}
                className={`w-8 h-8 rounded text-xs ${p === page ? 'bg-brux-accent text-white' : 'text-brux-gray hover:bg-brux-light'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// アンケート集計パネル
// ============================================================
function SurveyPanel() {
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/survey?form_id=demo')
      .then(r => r.json()).then(setSurvey).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const fieldLabels: Record<string, string> = {
    inquiry_type: 'お問い合わせ種別',
    how_found: '認知経路',
    interest_products: '関心のある製品カテゴリ',
    satisfaction: '現在の製品満足度',
    catalog: 'ご希望カタログ',
  };

  const results = survey?.results || {};

  if (Object.keys(results).length === 0) {
    return (
      <div className="bg-white rounded-xl border border-brux-line p-12 text-center">
        <p className="text-brux-gray text-sm">アンケートデータがまだありません</p>
        <p className="text-xs text-brux-gray mt-2">フォームからデータが送信されると、ここに集計結果が表示されます。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">アンケート集計</h2>
        <span className="text-xs text-brux-gray">総回答数: {survey?.totalResponses || 0}件</span>
      </div>

      {Object.entries(results).map(([fieldId, counts]) => {
        const entries = Object.entries(counts as Record<string, number>).sort((a, b) => b[1] - a[1]);
        const total = entries.reduce((s, [, v]) => s + v, 0);

        return (
          <div key={fieldId} className="bg-white rounded-xl border border-brux-line p-6">
            <h3 className="text-sm font-bold mb-4">{fieldLabels[fieldId] || fieldId}</h3>
            <div className="space-y-3">
              {entries.map(([label, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-brux-gray w-48 shrink-0 truncate" title={label}>{label}</span>
                    <div className="flex-1 h-5 bg-brux-light rounded-full overflow-hidden">
                      <div className="h-full bg-brux-accent rounded-full transition-all duration-500 flex items-center px-2"
                        style={{ width: `${Math.max(pct, 3)}%` }}>
                        {pct >= 15 && <span className="text-[9px] text-white font-bold">{pct}%</span>}
                      </div>
                    </div>
                    <span className="text-xs text-brux-gray w-16 text-right">{count}件 ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 設定パネル
// ============================================================
function SettingsPanel() {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const checkDb = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/admin/init-db', { method: 'POST' });
      const data = await res.json();
      setDbStatus(data);
    } catch {
      setDbStatus({ error: '接続エラー' });
    } finally {
      setChecking(false);
    }
  };

  const embedCode = typeof window !== 'undefined'
    ? `<div id="brux-neoform" data-form-id="demo"></div>\n<script src="${window.location.origin}/embed.js"></script>`
    : '';

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    alert('コピーしました！');
  };

  return (
    <div className="space-y-6">
      {/* DB接続テスト */}
      <div className="bg-white rounded-xl border border-brux-line p-6">
        <h3 className="text-sm font-bold mb-4">データベース接続</h3>
        <button onClick={checkDb} disabled={checking} className="btn-primary text-xs">
          {checking ? 'チェック中...' : 'DB接続テスト'}
        </button>
        {dbStatus && (
          <div className="mt-4 p-4 bg-brux-bg rounded-lg text-xs">
            <p className={dbStatus.success ? 'text-brux-success' : 'text-brux-error'}>
              {dbStatus.success ? '✅ 接続OK・テーブル確認済み' : `❌ ${dbStatus.message || dbStatus.error}`}
            </p>
            {dbStatus.sql && (
              <details className="mt-3">
                <summary className="cursor-pointer text-brux-accent">手動実行用SQL</summary>
                <pre className="mt-2 p-3 bg-brux-navy text-green-400 rounded text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {dbStatus.sql}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* 埋め込みコード */}
      <div className="bg-white rounded-xl border border-brux-line p-6">
        <h3 className="text-sm font-bold mb-4">WordPress埋め込みコード</h3>
        <div className="bg-brux-navy rounded-lg p-4 text-xs font-mono text-green-400 mb-4">
          <pre className="whitespace-pre-wrap break-all">{embedCode}</pre>
        </div>
        <button onClick={copyEmbed} className="btn-secondary text-xs">📋 コピー</button>
      </div>

      {/* 環境変数一覧 */}
      <div className="bg-white rounded-xl border border-brux-line p-6">
        <h3 className="text-sm font-bold mb-4">必要な環境変数（Vercel設定）</h3>
        <div className="space-y-2 text-xs font-mono">
          {[
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'RESEND_API_KEY',
            'RESEND_FROM_EMAIL',
            'ADMIN_NOTIFY_EMAIL',
            'ADMIN_PASSWORD',
          ].map(env => (
            <div key={env} className="flex items-center gap-2 p-2 bg-brux-bg rounded">
              <span className="text-brux-accent">{env}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ダウンロード統計パネル
// ============================================================
function DownloadsPanel() {
  const [dlData, setDlData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/download-log?form_id=request')
      .then(r => r.json()).then(setDlData).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (!dlData || dlData.totalDownloads === 0) {
    return (
      <div className="bg-white rounded-xl border border-brux-line p-12 text-center">
        <p className="text-brux-gray text-sm">ダウンロードデータがまだありません</p>
        <p className="text-xs text-brux-gray mt-2">資料請求フォームからカタログがダウンロードされると、ここに統計が表示されます。</p>
      </div>
    );
  }

  const dailyEntries = Object.entries(dlData.dailyCounts || {});
  const maxDaily = Math.max(...dailyEntries.map(([, v]) => v as number), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">ダウンロード統計</h2>
        <span className="text-xs text-brux-gray">総DL数: {dlData.totalDownloads}件</span>
      </div>

      {/* カタログ別ダウンロード数 */}
      <div className="bg-white rounded-xl border border-brux-line p-6">
        <h3 className="text-sm font-bold mb-4">カタログ別ダウンロード数</h3>
        <div className="space-y-3">
          {(dlData.catalogList || []).map((cat: any) => {
            const pct = dlData.totalDownloads > 0 ? Math.round((cat.downloads / dlData.totalDownloads) * 100) : 0;
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="text-xs text-brux-gray w-56 shrink-0 truncate" title={cat.description}>{cat.description}</span>
                <div className="flex-1 h-5 bg-brux-light rounded-full overflow-hidden">
                  <div className="h-full bg-brux-accent rounded-full transition-all duration-500 flex items-center px-2"
                    style={{ width: `${Math.max(pct, 3)}%` }}>
                    {pct >= 15 && <span className="text-[9px] text-white font-bold">{pct}%</span>}
                  </div>
                </div>
                <span className="text-xs text-brux-gray w-16 text-right">{cat.downloads}件</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 日別DLグラフ */}
      <div className="bg-white rounded-xl border border-brux-line p-6">
        <h3 className="text-sm font-bold mb-6">直近7日間のダウンロード数</h3>
        <div className="flex items-end gap-3 h-32">
          {dailyEntries.map(([date, count]) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-brux-accent">{count as number}</span>
              <div className="w-full rounded-t relative" style={{ height: `${Math.max(((count as number) / maxDaily) * 100, 4)}%` }}>
                <div className="absolute inset-0 bg-brux-success rounded-t" />
              </div>
              <span className="text-[10px] text-brux-gray">{date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 直近ダウンロード一覧 */}
      {dlData.recentLogs && dlData.recentLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-brux-line overflow-hidden">
          <div className="px-6 py-4 border-b border-brux-line/50">
            <h3 className="text-sm font-bold">直近のダウンロード</h3>
          </div>
          <div className="divide-y divide-brux-line/50">
            {dlData.recentLogs.map((log: any, i: number) => (
              <div key={i} className="px-6 py-3 flex items-center gap-4">
                <div className="w-8 h-8 bg-brux-success/10 rounded flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-brux-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{log.filename}</p>
                </div>
                <span className="text-[10px] text-brux-gray whitespace-nowrap">
                  {new Date(log.downloaded_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-brux-accent/30 border-t-brux-accent rounded-full animate-spin" />
    </div>
  );
}
