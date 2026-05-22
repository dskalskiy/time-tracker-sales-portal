'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSalesData } from '@/contexts/sales-data-context';

export function useDataLoading(): boolean {
  const { status } = useSalesData();
  return status === 'loading' || status === 'idle';
}

export function DataError() {
  const { error, reload } = useSalesData();

  return (
    <div className="portal-card flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border-destructive/25 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" />
      </div>
      <div className="max-w-md space-y-2">
        <h3 className="portal-section-title text-lg">
          Не удалось загрузить данные
        </h3>
        <p className="text-sm text-muted-foreground">
          {error?.message ??
            'Проверьте доступ к Google Sheets и подключение к интернету.'}
        </p>
      </div>
      <Button variant="outline" size="sm" className="gap-2" onClick={reload}>
        <RefreshCw className="size-4" />
        Повторить
      </Button>
    </div>
  );
}
