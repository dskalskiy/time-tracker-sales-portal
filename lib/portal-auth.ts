export const PORTAL_AUTH_KEY = 'sales-portal-authenticated';

/** Client-side gate password (inlined at build). Empty = auth disabled. */
export const PORTAL_PASSWORD =
  process.env.NEXT_PUBLIC_PORTAL_PASSWORD?.trim() ?? '';

export function isPasswordRequired(): boolean {
  return PORTAL_PASSWORD.length > 0;
}

export function verifyPassword(input: string): boolean {
  return input === PORTAL_PASSWORD;
}

export function readSessionAuth(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(PORTAL_AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function persistSessionAuth(): void {
  try {
    sessionStorage.setItem(PORTAL_AUTH_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearSessionAuth(): void {
  try {
    sessionStorage.removeItem(PORTAL_AUTH_KEY);
  } catch {
    /* ignore */
  }
}
