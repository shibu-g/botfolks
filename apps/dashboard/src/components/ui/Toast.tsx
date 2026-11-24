import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastTone = 'success' | 'error';
interface ToastItem { id: number; message: string; tone: ToastTone; }

const ToastContext = createContext<{ show: (message: string, tone?: ToastTone) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 sm:items-end">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-md border px-4 py-3 shadow-elevated animate-scale-in
                ${t.tone === 'success' ? 'border-ok/30 bg-[#0f2a22] text-text' : 'border-err/30 bg-[#2a1414] text-text'}`}
            >
              {t.tone === 'success' ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" />
              ) : (
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-err" />
              )}
              <span className="flex-1 text-[14px]">{t.message}</span>
              <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="shrink-0 border-0 bg-transparent p-0 text-muted hover:text-text">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
