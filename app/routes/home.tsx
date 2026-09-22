import { ChevronRight, Search, Store } from 'lucide-react';
import { Form, Link, redirect, useNavigation } from 'react-router';
import { AppShell } from '~/components/app-shell';
import { InstallBadge, PlanBadge } from '~/components/store-badges';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { requireStaff } from '~/.server/auth';
import { normalizeDomain, searchStores } from '~/.server/store';
import type { Route } from './+types/home';

export const meta: Route.MetaFunction = () => [{ title: 'Stores · Pandectes Staff' }];

export async function loader({ request }: Route.LoaderArgs) {
  const email = await requireStaff(request);
  const query = (new URL(request.url).searchParams.get('q') ?? '').trim();

  if (!query) {
    return { email, query, results: [] };
  }

  const results = await searchStores(query);
  const normalized = normalizeDomain(query);

  // An exact hit is what staff meant; skip the one-row results table.
  const exact = results.find((hit) => hit.shop === normalized || hit.domain === normalized);
  if (exact) {
    throw redirect(`/stores/${encodeURIComponent(exact.shop)}`);
  }

  return { email, query, results };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { email, query, results } = loaderData;
  const navigation = useNavigation();
  const searching = navigation.state === 'loading' && navigation.location?.pathname === '/';

  return (
    <AppShell email={email}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Store lookup</h1>
          <p className="text-sm text-muted-foreground">
            Search by myshopify handle or storefront domain to see a store's status.
          </p>
        </div>

        <Card>
          <CardContent>
            <Form method="get" className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={query}
                  autoFocus
                  placeholder="example.myshopify.com"
                  className="pl-9"
                  aria-label="Shopify domain"
                />
              </div>
              <Button type="submit" disabled={searching}>
                Search
              </Button>
            </Form>
          </CardContent>
        </Card>

        {query ? (
          results.length ? (
            <Card className="py-0">
              <CardHeader className="border-b py-6">
                <CardTitle className="text-base">
                  {results.length} {results.length === 1 ? 'match' : 'matches'}
                </CardTitle>
                <CardDescription>for "{query}"</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {results.map((hit) => (
                    <li key={hit.shop}>
                      <Link
                        to={`/stores/${encodeURIComponent(hit.shop)}`}
                        className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-accent"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{hit.shopifyName}</div>
                          <div className="truncate text-xs text-muted-foreground">{hit.shop}</div>
                        </div>
                        <PlanBadge plan={hit.plan} />
                        <InstallBadge status={hit.status} closed={hit.closed} />
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <Store className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">No store matches "{query}"</p>
                <p className="text-sm text-muted-foreground">
                  Check the spelling, or try the storefront domain instead.
                </p>
              </CardContent>
            </Card>
          )
        ) : null}
      </div>
    </AppShell>
  );
}
