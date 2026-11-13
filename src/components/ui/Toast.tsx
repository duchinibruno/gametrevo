'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  confirm: (options: ConfirmDialogOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration: number = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, type, message, title, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message: string, title?: string) => addToast('success', message, title),
    error: (message: string, title?: string) => addToast('error', message, title),
    warning: (message: string, title?: string) => addToast('warning', message, title),
    info: (message: string, title?: string) => addToast('info', message, title)
  };

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (confirmDialog?.onCancel) {
      confirmDialog.onCancel();
    }
    setConfirmDialog(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(t => {
          let borderClass = 'border-emerald-500/50 bg-slate-900/95 text-emerald-300';
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;

          if (t.type === 'error') {
            borderClass = 'border-rose-500/50 bg-slate-900/95 text-rose-300';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          } else if (t.type === 'warning') {
            borderClass = 'border-amber-500/50 bg-slate-900/95 text-amber-300';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          } else if (t.type === 'info') {
            borderClass = 'border-cyan-500/50 bg-slate-900/95 text-cyan-300';
            icon = <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${borderClass}`}
            >
              <div className="pt-0.5">{icon}</div>
              <div className="flex-1 text-xs">
                {t.title && <div className="font-black text-white mb-0.5">{t.title}</div>}
                <div className="text-slate-200 font-medium leading-relaxed">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* In-App Confirmation Modal (substitui o confirm nativo feio do navegador) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelAction}
                disabled={confirmLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {confirmDialog.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {confirmLoading ? 'Processando...' : (confirmDialog.confirmText || 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}
