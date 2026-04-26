'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brux-bg">
      {/* ヒーロー */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brux-navy via-brux-blue to-brux-navy">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brux-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 md:py-32">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-[2px] bg-brux-accent" />
            <span className="text-xs tracking-[0.3em] text-brux-accent font-medium uppercase">
              BRUX NeoForm System
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            確実に届く<br />
            <span className="text-brux-accent">メールフォーム。</span>
          </h1>
          <p className="text-brux-gray text-base md:text-lg max-w-xl leading-relaxed mb-10">
            WordPressのメール不達問題を解決する、高到達率フォームシステム。
            アンケート集計・資料ダウンロード統計・AI サポートを統合。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/form/demo" className="btn-primary text-base px-10 py-4">
              デモフォームを見る →
            </Link>
            <Link href="/admin" className="btn-secondary border-white/20 text-white hover:bg-white/10">
              管理画面 →
            </Link>
          </div>
        </div>
      </div>

      {/* 機能カード */}
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: '01', title: '高到達率', desc: 'Resend専用インフラ経由。SPF/DKIM/DMARC対応で99.9%到達。WPメールの不達を根本解決。' },
            { num: '02', title: 'アンケート集計', desc: '選択肢・評価スケール対応。回答を自動集計しグラフ化。CSVエクスポートも。' },
            { num: '03', title: '管理ダッシュボード', desc: '送信一覧・統計・アンケート結果・DL統計を一画面で。複数クライアント対応。' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-8 border border-brux-line hover:border-brux-accent/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="text-[10px] tracking-[0.2em] text-brux-accent font-bold">{f.num}</span>
              <h3 className="text-lg font-bold mt-2 mb-3 group-hover:text-brux-accent transition-colors">{f.title}</h3>
              <p className="text-sm text-brux-gray leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* WP埋め込みガイド */}
        <div className="mt-16 bg-white rounded-xl border border-brux-line p-8 md:p-12">
          <h2 className="text-xl font-bold mb-4">WordPress 埋め込み方法</h2>
          <p className="text-sm text-brux-gray mb-6">
            以下のHTMLコードを固定ページやウィジェットに貼り付けるだけで設置完了です。
          </p>
          <div className="bg-brux-navy rounded-lg p-6 text-sm font-mono">
            <code className="text-green-400 break-all">
              {`<div id="brux-neoform" data-form-id="demo"></div>`}<br/>
              {`<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}/embed.js"></script>`}
            </code>
          </div>
        </div>
      </div>
    </main>
  );
}
