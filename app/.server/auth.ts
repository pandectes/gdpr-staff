import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { createCookie, createCookieSessionStorage, redirect } from 'react-router';
import { config } from './config';

const SECURE = !config.isDev;

/**
 * Holds the pending PIN challenge. The PIN itself is never stored — only an HMAC of it — so a
 * stolen cookie cannot be replayed into a valid code, and the cookie is signed on top of that.
 */
type Challenge = {
  email: string;
  hash: string;
  /** Unix seconds after which the PIN is dead. */
  exp: number;
  attempts: number;
};

const challengeCookie = createCookie('__staff_challenge', {
  httpOnly: true,
  secure: SECURE,
  sameSite: 'lax',
  path: '/',
  maxAge: config.pin.ttl,
  secrets: [config.session.secret],
});

const sessionStorage = createCookieSessionStorage<{ email: string }>({
  cookie: {
    name: '__staff_session',
    httpOnly: true,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: config.session.maxAge,
    secrets: [config.session.secret],
  },
});

export const isStaffEmail = (email: string): boolean =>
  config.staffEmails.includes(email.trim().toLowerCase());

const hashPin = (email: string, pin: string, exp: number): string =>
  createHmac('sha256', config.session.secret).update(`${email}:${pin}:${exp}`).digest('hex');

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  // timingSafeEqual throws on length mismatch, and the lengths here are not secret.
  return left.length === right.length && timingSafeEqual(left, right);
};

/** Mints a PIN and the cookie that will later be able to check it. */
export async function createChallenge(email: string) {
  const normalized = email.trim().toLowerCase();
  const pin = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const exp = Math.floor(Date.now() / 1000) + config.pin.ttl;
  const challenge: Challenge = {
    email: normalized,
    hash: hashPin(normalized, pin, exp),
    exp,
    attempts: 0,
  };

  return { pin, email: normalized, cookie: await challengeCookie.serialize(challenge) };
}

export async function readChallenge(request: Request): Promise<Challenge | null> {
  const challenge = (await challengeCookie.parse(
    request.headers.get('Cookie'),
  )) as Challenge | null;
  if (!challenge?.email || !challenge.hash) {
    return null;
  }
  if (challenge.exp * 1000 < Date.now()) {
    return null;
  }
  return challenge;
}

export const clearChallenge = () => challengeCookie.serialize('', { maxAge: 0 });

type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'expired' | 'locked' | 'mismatch'; cookie?: string };

export async function verifyChallenge(request: Request, pin: string): Promise<VerifyResult> {
  const challenge = await readChallenge(request);
  if (!challenge) {
    return { ok: false, reason: 'expired' };
  }
  if (challenge.attempts >= config.pin.maxAttempts) {
    return { ok: false, reason: 'locked', cookie: await clearChallenge() };
  }

  if (safeEqual(challenge.hash, hashPin(challenge.email, pin.trim(), challenge.exp))) {
    return { ok: true, email: challenge.email };
  }

  const attempts = challenge.attempts + 1;
  const spent = attempts >= config.pin.maxAttempts;
  return {
    ok: false,
    reason: spent ? 'locked' : 'mismatch',
    cookie: spent
      ? await clearChallenge()
      : await challengeCookie.serialize({ ...challenge, attempts }),
  };
}

export async function startSession(email: string): Promise<string> {
  const session = await sessionStorage.getSession();
  session.set('email', email);
  return sessionStorage.commitSession(session);
}

export async function endSession(request: Request): Promise<string> {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return sessionStorage.destroySession(session);
}

/** The signed-in staff email, or null. Re-checks the allowlist so revoking access takes effect. */
export async function getStaff(request: Request): Promise<string | null> {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  const email = session.get('email');
  return email && isStaffEmail(email) ? email : null;
}

export async function requireStaff(request: Request): Promise<string> {
  const email = await getStaff(request);
  if (!email) {
    const { pathname, search } = new URL(request.url);
    const redirectTo = `${pathname}${search}`;
    const params = redirectTo === '/' ? '' : `?redirectTo=${encodeURIComponent(redirectTo)}`;
    throw redirect(`/login${params}`);
  }
  return email;
}
