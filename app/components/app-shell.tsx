import { LogOut, ShieldCheck } from 'lucide-react';
import { Form, Link } from 'react-router';
import { Button } from '~/components/ui/button';

export function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <ShieldCheck className="size-4" />
            Pandectes Staff
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <Form method="post" action="/logout">
              <Button type="submit" variant="ghost" size="sm">
                <LogOut />
                Sign out
              </Button>
            </Form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
