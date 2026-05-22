'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { persistSessionAuth, verifyPassword } from '@/lib/portal-auth';

interface PortalLoginProps {
  onSuccess: () => void;
}

export function PortalLogin({ onSuccess }: PortalLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    if (verifyPassword(password)) {
      persistSessionAuth();
      onSuccess();
      return;
    }

    setError('Неверный пароль');
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/time-tracker-logo.png"
            alt="Time Tracker"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
          <div>
            <h1 className="text-base font-semibold">Портал продаж</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Введите пароль для доступа
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="portal-password" className="text-xs text-muted-foreground">
              Пароль
            </Label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="portal-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 pl-8"
                placeholder="••••••••"
                disabled={submitting}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !password}>
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
