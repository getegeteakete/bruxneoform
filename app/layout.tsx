import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BRUX NeoForm - お問い合わせ・資料請求',
  description: '株式会社ブルックスジャパン お問い合わせ・資料請求フォーム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
