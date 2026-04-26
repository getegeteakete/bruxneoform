export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// カタログファイルの定義（実際のPDF URLに差し替え可能）
const CATALOG_FILES: Record<string, { filename: string; description: string; url?: string }> = {
  'teknek-hr': { filename: 'Teknek_HandRoller_Tek-HR.pdf', description: 'TeknekハンドローラーTek-HR' },
  'teknek-bc': { filename: 'Teknek_SMT_Tek-BC.pdf', description: 'Teknek SMT基板クリーナー Tek-BCシリーズ' },
  'teknek-sheet': { filename: 'Teknek_SheetCleaner.pdf', description: 'Teknek シートクリーナー' },
  'teknek-web': { filename: 'Teknek_WebCleaner.pdf', description: 'Teknek ウェブクリーナー（リールtoリール用）' },
  'teknek-all': { filename: 'Teknek_General_Catalog.pdf', description: 'Teknek 総合カタログ' },
  'lpkf-mask': { filename: 'LPKF_MetalMask_Laser.pdf', description: 'LPKF メタルマスクレーザー加工機P6060 / G6080 / MicroCut6080' },
  'lpkf-power': { filename: 'LPKF_PowerCut6080.pdf', description: 'LPKF 精密金属部品レーザー加工機 PowerCut6080' },
  'lpkf-frame': { filename: 'LPKF_AirTensionFrame.pdf', description: 'LPKF エアーテンションフレーム' },
  'stainless': { filename: 'Stainless_Sheet.pdf', description: 'ステンレスシート' },
  'aerocom': { filename: 'Aerocom_AirTube.pdf', description: 'Aerocomエアチューブシステム気送管搬送装置' },
  'protec': { filename: 'PROTEC_Engineering.pdf', description: 'PROTECエンジニアリング製品' },
};

// カタログ名からファイルIDを逆引き
function findFileId(catalogName: string): string | null {
  for (const [id, info] of Object.entries(CATALOG_FILES)) {
    if (info.description === catalogName) return id;
  }
  return null;
}

// POST: ダウンロードログ記録
export async function POST(req: NextRequest) {
  try {
    const { form_id, file_id, filename, submission_id, email, company_name } = await req.json();

    await supabaseAdmin.from('download_logs').insert({
      form_id: form_id || 'request',
      file_id,
      filename: filename || CATALOG_FILES[file_id]?.filename || file_id,
      submission_id: submission_id || null,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Download log error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET: ダウンロード統計取得（管理画面用）
export async function GET(req: NextRequest) {
  try {
    const formId = req.nextUrl.searchParams.get('form_id') || 'request';

    // ファイル別ダウンロード数
    const { data: logs } = await supabaseAdmin
      .from('download_logs')
      .select('file_id, filename, created_at')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    // 集計
    const fileCounts: Record<string, { filename: string; count: number }> = {};
    let totalDownloads = 0;

    (logs || []).forEach(log => {
      const key = log.file_id;
      if (!fileCounts[key]) {
        fileCounts[key] = {
          filename: log.filename || CATALOG_FILES[key]?.description || key,
          count: 0,
        };
      }
      fileCounts[key].count++;
      totalDownloads++;
    });

    // 日別ダウンロード数（直近7日）
    const dailyCounts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dailyCounts[d.toISOString().split('T')[0]] = 0;
    }
    (logs || []).forEach(log => {
      const day = log.created_at.split('T')[0];
      if (dailyCounts[day] !== undefined) dailyCounts[day]++;
    });

    // 直近ダウンロード一覧（最新20件）
    const recentLogs = (logs || []).slice(0, 20).map(log => ({
      file_id: log.file_id,
      filename: log.filename || CATALOG_FILES[log.file_id]?.description || log.file_id,
      downloaded_at: log.created_at,
    }));

    return NextResponse.json({
      totalDownloads,
      fileCounts: Object.values(fileCounts).sort((a, b) => b.count - a.count),
      dailyCounts,
      recentLogs,
      catalogList: Object.entries(CATALOG_FILES).map(([id, info]) => ({
        id,
        filename: info.filename,
        description: info.description,
        downloads: fileCounts[id]?.count || 0,
      })),
    });
  } catch (err) {
    console.error('Download stats error:', err);
    return NextResponse.json({ error: 'download stats error' }, { status: 500 });
  }
}
