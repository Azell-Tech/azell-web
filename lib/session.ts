export type Session = {
  tenantCode: string;
  userName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  approved: boolean;
};

export const COOKIE_NAME = 'azell_session';

export function encodeSession(s: Session) {
  return encodeURIComponent(JSON.stringify(s));
}

export function decodeSession(raw?: string | null): Session | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as Session;
  } catch {
    return null;
  }
}
