import { AlertCircle, ArrowLeft, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { data, Form, redirect, useNavigation, useSearchParams } from 'react-router';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  clearChallenge,
  createChallenge,
  getStaff,
  isStaffEmail,
  readChallenge,
  startSession,
  verifyChallenge,
} from '~/.server/auth';
import { sendPinEmail } from '~/.server/email';
import type { Route } from './+types/login';

export const meta: Route.MetaFunction = () => [{ title: 'Sign in · Pandectes Staff' }];

/** Only ever send people to a path inside this app. */
const safeRedirect = (to: string | null): string =>
  to && to.startsWith('/') && !to.startsWith('//') ? to : '/';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const redirectTo = safeRedirect(url.searchParams.get('redirectTo'));

  if (await getStaff(request)) {
    throw redirect(redirectTo);
  }

  const challenge = await readChallenge(request);
  return { pendingEmail: challenge?.email ?? null, redirectTo };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = String(form.get('intent') ?? '');
  const redirectTo = safeRedirect(String(form.get('redirectTo') ?? '/'));

  if (intent === 'restart') {
    return data({ error: null }, { headers: { 'Set-Cookie': await clearChallenge() } });
  }

  if (intent === 'request') {
    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();

    // Rejected before a PIN exists, so a stranger's address is never mailed anything.
    if (!isStaffEmail(email)) {
      return data({ error: 'That email cannot sign in to the staff panel.' }, { status: 403 });
    }

    const challenge = await createChallenge(email);
    await sendPinEmail(challenge.email, challenge.pin);
    return data({ error: null }, { headers: { 'Set-Cookie': challenge.cookie } });
  }

  if (intent === 'verify') {
    const pin = String(form.get('pin') ?? '').replace(/\D/g, '');
    const result = await verifyChallenge(request, pin);

    if (result.ok) {
      const headers = new Headers();
      headers.append('Set-Cookie', await startSession(result.email));
      headers.append('Set-Cookie', await clearChallenge());
      throw redirect(redirectTo, { headers });
    }

    const message =
      result.reason === 'locked'
        ? 'Too many wrong codes. Request a new one.'
        : result.reason === 'expired'
          ? 'That code expired. Request a new one.'
          : 'Wrong code. Try again.';

    return data(
      { error: message },
      { status: 400, ...(result.cookie ? { headers: { 'Set-Cookie': result.cookie } } : {}) },
    );
  }

  return data({ error: 'Unknown action.' }, { status: 400 });
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  const { pendingEmail, redirectTo } = loaderData;
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const busy = navigation.state === 'submitting';
  const error = actionData?.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="size-5" />
          <span className="text-sm font-semibold tracking-tight">Pandectes Staff</span>
        </div>

        <Card>
          {pendingEmail ? (
            <>
              <CardHeader>
                <CardTitle>Enter your code</CardTitle>
                <CardDescription>
                  We sent a 6-digit code to <span className="font-medium">{pendingEmail}</span>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                {/* Keyed so React swaps the DOM node between the two steps instead of reusing
                    the email input and carrying its value into the PIN field. */}
                <Form method="post" className="space-y-4" key="verify">
                  <input type="hidden" name="intent" value="verify" />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <div className="space-y-2">
                    <Label htmlFor="pin">Verification code</Label>
                    <Input
                      id="pin"
                      name="pin"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="000000"
                      className="text-center text-lg tracking-[0.5em]"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="animate-spin" /> : null}
                    Sign in
                  </Button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="restart" />
                  <Button type="submit" variant="ghost" size="sm" className="w-full">
                    <ArrowLeft />
                    Use a different email
                  </Button>
                </Form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Sign in</CardTitle>
                <CardDescription>
                  We will email you a one-time code. Staff accounts only.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <Form method="post" className="space-y-4" key="request">
                  <input type="hidden" name="intent" value="request" />
                  <input
                    type="hidden"
                    name="redirectTo"
                    value={safeRedirect(searchParams.get('redirectTo'))}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      autoFocus
                      placeholder="Your email"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="animate-spin" /> : <Mail />}
                    Email me a code
                  </Button>
                </Form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
