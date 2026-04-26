# BRUX NeoForm

株式会社ブルックスジャパン向け 高到達率メールフォームシステム。

## 機能
- **ステップ式フォーム**: 種別選択 → 会社情報 → アンケート → 確認 → 送信
- **Resend連携**: SPF/DKIM/DMARC対応の高到達率メール送信
- **アンケート集計**: 選択肢・評価スケール対応、グラフ表示
- **管理ダッシュボード**: 統計・送信一覧・アンケート結果・CSV出力
- **WP埋め込み**: iframe方式で既存WPサイトに簡単設置
- **スパム対策**: ハニーポット・速度チェック・キーワードフィルター・レート制限

## 技術スタック
- Next.js 14 (App Router)
- Supabase (PostgreSQL)
- Resend (メール送信)
- TailwindCSS
- Vercel (デプロイ)

## セットアップ

### 1. Supabase
`migrations/001_init.sql` をSQL Editorで実行

### 2. 環境変数
`.env.example` を `.env.local` にコピーして値を設定

### 3. 開発
```bash
npm install
npm run dev
```

### 4. WordPress埋め込み
```html
<div id="brux-neoform" data-form-id="demo"></div>
<script src="https://your-domain.vercel.app/embed.js"></script>
```
