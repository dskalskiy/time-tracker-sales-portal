'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { buildSalesData, validateSalesData } from '@/lib/data-mappers';
import type { SalesData, SalesDataError } from '@/lib/types';
import { fetchAllSheets } from '@/services/googleSheets';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type LoadState = 'idle' | 'loading' | 'success' | 'error';

interface SalesDataContextValue {
  data: SalesData | null;
  status: LoadState;
  error: SalesDataError | null;
  reload: () => void;
}

const SalesDataContext = createContext<SalesDataContextValue | null>(null);

function toError(error: unknown): SalesDataError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: 'SHEET_UNAVAILABLE',
      message: 'Не удалось подключиться к Google Sheets. Проверьте доступ к таблице.',
    };
  }

  const message =
    error instanceof Error ? error.message : 'Неизвестная ошибка загрузки данных';

  if (message.includes('unavailable') || message.includes('Invalid Google')) {
    return { code: 'SHEET_UNAVAILABLE', message };
  }

  if (message.includes('No ') && message.includes('found')) {
    return { code: 'NO_DATA', message };
  }

  return { code: 'LOAD_ERROR', message };
}

export function SalesDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SalesData | null>(null);
  const [status, setStatus] = useState<LoadState>('idle');
  const [error, setError] = useState<SalesDataError | null>(null);
  const dataRef = useRef<SalesData | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async (silent = false) => {
    const hasData = dataRef.current !== null;

    if (!silent || !hasData) {
      setStatus('loading');
      setError(null);
    }

    try {
      const raw = await fetchAllSheets();
      const salesData = buildSalesData(raw);
      validateSalesData(salesData);
      setData(salesData);
      setStatus('success');
      setError(null);
    } catch (err) {
      if (silent && dataRef.current) {
        return;
      }
      setData(null);
      setError(toError(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load(false);
    const intervalId = window.setInterval(() => {
      load(true);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [load]);

  const reload = useCallback(() => {
    load(false);
  }, [load]);

  const value = useMemo(
    () => ({
      data,
      status,
      error,
      reload,
    }),
    [data, status, error, reload]
  );

  return (
    <SalesDataContext.Provider value={value}>{children}</SalesDataContext.Provider>
  );
}

export function useSalesData() {
  const context = useContext(SalesDataContext);
  if (!context) {
    throw new Error('useSalesData must be used within SalesDataProvider');
  }
  return context;
}
