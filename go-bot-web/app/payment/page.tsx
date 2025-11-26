'use client';

import { Suspense } from 'react';
import { Bot } from 'lucide-react';
import PaymentContent from './PaymentContent';

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoadingFallback />}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                GoBot
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* Loading State */}
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mb-6" />
          <p className="text-xl text-slate-400">Loading payment details...</p>
        </div>
      </main>
    </div>
  );
}