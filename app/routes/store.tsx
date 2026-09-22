import { ArrowLeft, ExternalLink } from 'lucide-react';
import { data, Link } from 'react-router';
import { AppShell } from '~/components/app-shell';
import { InstallBadge, PlanBadge, TokenBadge } from '~/components/store-badges';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { formatDate, formatMoney, formatTs, relativeDays } from '~/lib/format';
import { requireStaff } from '~/.server/auth';
import { getStore } from '~/.server/store';
import type { Route } from './+types/store';

export const meta: Route.MetaFunction = ({ data: loaded }) => [
  { title: loaded ? `${loaded.shop.shopifyName} · Pandectes Staff` : 'Store · Pandectes Staff' },
];

export async function loader({ request, params }: Route.LoaderArgs) {
  const email = await requireStaff(request);
  const store = await getStore(params.domain);

  if (!store) {
    throw data(`No store found for "${params.domain}".`, { status: 404 });
  }

  return { email, ...store };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-all">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">{children}</dl>
      </CardContent>
    </Card>
  );
}

const trialLabel = (endsOn: Date | string | null) => {
  const days = relativeDays(endsOn);
  if (days === null) return '—';
  return days >= 0 ? `${formatDate(endsOn)} (${days}d left)` : `${formatDate(endsOn)} (ended)`;
};

export default function StoreDetail({ loaderData }: Route.ComponentProps) {
  const { email, shop, charges } = loaderData;

  return (
    <AppShell email={email}>
      <div className="space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to search
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{shop.shopifyName}</h1>
            <a
              href={`https://${shop.shop}/admin`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {shop.shop}
              <ExternalLink className="size-3" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InstallBadge status={shop.status} closed={shop.closed} />
            <PlanBadge plan={shop.plan} />
            {shop.legacyPlan ? <Badge variant="outline">Legacy plan</Badge> : null}
            {shop.adminMode ? <Badge variant="warning">Admin mode</Badge> : null}
            <Badge variant="outline">{shop.version}</Badge>
            {shop.bannerV2 ? <Badge variant="outline">Banner v2</Badge> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Store">
            <Row label="Shopify ID">{shop.shopifyId}</Row>
            <Row label="Storefront">{shop.domain}</Row>
            <Row label="Owner">{shop.shopifyShopOwner ?? '—'}</Row>
            <Row label="Email">{shop.shopifyEmail ?? '—'}</Row>
            <Row label="Shopify plan">{shop.shopifyPlanName ?? '—'}</Row>
            <Row label="Country">
              {shop.shopifyCountryName ?? '—'}
              {shop.shopifyCity ? ` · ${shop.shopifyCity}` : ''}
            </Row>
            <Row label="Locale">{shop.shopifyPrimaryLocale ?? '—'}</Row>
            <Row label="Timezone">{shop.shopifyIanaTimezone ?? '—'}</Row>
            <Row label="On Shopify since">{formatDate(shop.shopifyCreatedAt)}</Row>
            <Row label="Referral">{shop.referral ?? '—'}</Row>
          </Section>

          <Section title="Billing">
            <Row label="Plan">
              <PlanBadge plan={shop.plan} />
            </Row>
            <Row label="Interval">
              {shop.billingInterval === 'ANNUAL'
                ? 'Annual'
                : shop.billingInterval === 'EVERY_30_DAYS'
                  ? 'Monthly'
                  : '—'}
            </Row>
            <Row label="Active charge">{shop.activeChargeId ?? '—'}</Row>
            <Row label="Plan changed">{formatTs(shop.tsPlanChanged)}</Row>
            <Row label="Plus trial">{trialLabel(shop.plusTrialEndsOn)}</Row>
            <Row label="Premium trial">{trialLabel(shop.premiumTrialEndsOn)}</Row>
            <Row label="Enterprise trial">{trialLabel(shop.enterpriseTrialEndsOn)}</Row>
          </Section>

          <Section title="Access">
            <Row label="Access token">
              <TokenBadge status={shop.accessTokenStatus} />
            </Row>
            <Row label="Token checked">{formatTs(shop.tsAccessTokenChecked)}</Row>
            <Row label="Scopes">{shop.accessScopes ?? '—'}</Row>
            <Row label="Last login">{formatTs(shop.tsLastLogin)}</Row>
          </Section>

          <Section title="Deployment">
            <Row label="Onboarding done">{shop.onboarding ? 'Yes' : 'No'}</Row>
            <Row label="Script tags">{shop.scriptTags ? 'Yes' : 'No'}</Row>
            <Row label="Powered by">{shop.showPoweredBy ? 'Shown' : 'Hidden'}</Row>
            <Row label="Theme">{shop.themeName ?? shop.themeDetected ?? '—'}</Row>
            <Row label="Headless">{shop.headlessStore}</Row>
            <Row label="Checkout assets">{shop.checkoutAssets}</Row>
            <Row label="Settings asset">{shop.settingsAssetUrl ?? '—'}</Row>
            <Row label="Blocker asset">{shop.blockerAssetUrl ?? '—'}</Row>
            <Row label="Last published">{formatTs(shop.tsPublished)}</Row>
            <Row label="Last scan">{formatTs(shop.tsScanned)}</Row>
          </Section>

          <Section title="Lifecycle">
            <Row label="First installed">{formatTs(shop.tsInstalled)}</Row>
            <Row label="Last installed">{formatTs(shop.tsLastInstalled)}</Row>
            <Row label="Uninstalled">{formatTs(shop.tsUninstalled)}</Row>
            <Row label="Closed">{formatTs(shop.tsClosed)}</Row>
          </Section>
        </div>

        <Card className="py-0">
          <CardHeader className="border-b py-6">
            <CardTitle className="text-base">Charges</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {charges.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-6 py-2 text-left font-medium">Plan</th>
                      <th className="px-6 py-2 text-left font-medium">Status</th>
                      <th className="px-6 py-2 text-right font-medium">Price</th>
                      <th className="px-6 py-2 text-right font-medium">Discount</th>
                      <th className="px-6 py-2 text-left font-medium">Activated</th>
                      <th className="px-6 py-2 text-left font-medium">Next billing</th>
                      <th className="px-6 py-2 text-left font-medium">Cancelled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {charges.map((charge) => (
                      <tr key={charge.id}>
                        <td className="px-6 py-2">
                          {charge.plan}
                          <span className="ml-1 text-muted-foreground">
                            {charge.interval === 'ANNUAL' ? '/yr' : '/mo'}
                          </span>
                        </td>
                        <td className="px-6 py-2">
                          <Badge
                            variant={
                              charge.status === 'active'
                                ? 'success'
                                : charge.status === 'cancelled' || charge.status === 'declined'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {charge.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-2 text-right">{formatMoney(charge.price)}</td>
                        <td className="px-6 py-2 text-right">
                          {charge.discount ? formatMoney(charge.discount) : '—'}
                        </td>
                        <td className="px-6 py-2">{formatDate(charge.activatedOn)}</td>
                        <td className="px-6 py-2">{formatDate(charge.billingOn)}</td>
                        <td className="px-6 py-2">{formatDate(charge.cancelledOn)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No charges recorded.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
