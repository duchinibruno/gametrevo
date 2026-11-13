'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Database, KeyRound, ExternalLink } from 'lucide-react';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
}

export function SupabaseGuideModal({ isOpen, onClose, isConfigured }: SupabaseGuideModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const envSnippet = `# Adicione no seu arquivo .env.local na raiz do projeto:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opcional (para gerar Ditloids novos com IA se quiser temas livres):
GEMINI_API_KEY=`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Conexão com o Supabase</h3>
            <p className="text-xs text-slate-400">
              {isConfigured ? '✅ Suas credenciais estão ativas' : 'ℹ️ Atualmente rodando em Modo Memória (Local)'}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <KeyRound className="w-4 h-4" /> Passo 1: Configurar variáveis no .env.local
            </div>
            <p className="text-slate-400 leading-relaxed">
              No painel do seu projeto Supabase, acesse <strong>Project Settings &gt; API</strong> e copie a <strong>Project URL</strong> e a <strong>anon public key</strong>.
            </p>
            <div className="relative mt-2">
              <pre className="bg-slate-950 p-3 rounded-lg text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800">
                {envSnippet}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1 font-medium transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <Database className="w-4 h-4" /> Passo 2: Executar o script SQL
            </div>
            <p className="text-slate-400 leading-relaxed">
              O arquivo com a criação das tabelas, chaves e participantes iniciais está pronto em:
            </p>
            <code className="block bg-slate-950 p-2.5 rounded-lg text-emerald-300 font-mono text-[11px] border border-slate-800">
              supabase/schema.sql
            </code>
            <p className="text-[11px] text-slate-400">
              Basta copiar o conteúdo desse arquivo e colar no <strong>SQL Editor</strong> do seu painel Supabase.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
