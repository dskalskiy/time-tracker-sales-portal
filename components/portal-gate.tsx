'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { PortalLogin } from '@/components/portal-login';
import { isPasswordRequired, readSessionAuth } from '@/lib/portal-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function PortalGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!isPasswordRequired()) {
      setAuthed(true);
    } else {
      setAuthed(readSessionAuth());
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="portal-shell flex min-h-screen items-center justify-center px-4">
        <div className="portal-bg" aria-hidden />
        <div className="portal-auth-card portal-content w-full max-w-sm space-y-4 p-6">
          <Skeleton className="mx-auto h-8 w-32" />
          <Skeleton className="h-4 w-40 mx-auto" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    );
  }

  if (!authed) {
    return <PortalLogin onSuccess={() => setAuthed(true)} />;
  }

  return <>{children}</>;
}
