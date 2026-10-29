'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/core/store';
import { X, AlertCircle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, setToast } = useDashboardStore();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage, setToast]);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-go2x-lg border border-go2x-border bg-go2x-surface p-3 text-xs font-medium text-go2x-text shadow-xl transition-all">
      <AlertCircle className="h-4 w-4 text-go2x-warn" />
      <span>{toastMessage}</span>
      <button
        type="button"
        onClick={() => setToast(null)}
        className="ml-2 rounded p-1 text-go2x-text-muted hover:bg-go2x-surface-alt hover:text-go2x-text"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
