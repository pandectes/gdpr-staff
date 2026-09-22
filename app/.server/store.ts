import { desc, eq, like, or } from 'drizzle-orm';
import { charges, db, shops } from './db';

/**
 * Strips whatever staff paste — a full admin URL, a bare handle, a custom domain — down to a bare
 * hostname. Used as the search needle, so it deliberately does not complete a partial handle.
 */
export function cleanInput(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ?? ''
  ).replace(/:\d+$/, '');
}

/**
 * The same, but completes a bare handle into a myshopify domain. Used where we want one exact
 * store — `silintzir-dev3` should open `silintzir-dev3.myshopify.com`.
 */
export function normalizeDomain(input: string): string {
  const value = cleanInput(input);
  return value && !value.includes('.') ? `${value}.myshopify.com` : value;
}

export type StoreSearchHit = {
  shop: string;
  domain: string;
  shopifyName: string;
  status: (typeof shops.$inferSelect)['status'];
  plan: (typeof shops.$inferSelect)['plan'];
  closed: boolean;
};

/** Matches on both the myshopify handle and the storefront domain, so either one finds the store. */
export async function searchStores(query: string, limit = 25): Promise<StoreSearchHit[]> {
  const term = cleanInput(query);
  if (!term) {
    return [];
  }
  const pattern = `%${term.replace(/[%_]/g, '\\$&')}%`;

  return db
    .select({
      shop: shops.shop,
      domain: shops.domain,
      shopifyName: shops.shopifyName,
      status: shops.status,
      plan: shops.plan,
      closed: shops.closed,
    })
    .from(shops)
    .where(or(like(shops.shop, pattern), like(shops.domain, pattern)))
    .orderBy(desc(shops.tsLastLogin))
    .limit(limit);
}

export async function getStore(domain: string) {
  const normalized = normalizeDomain(domain);
  const [shop] = await db
    .select()
    .from(shops)
    .where(or(eq(shops.shop, normalized), eq(shops.domain, normalized)))
    .limit(1);

  if (!shop) {
    return null;
  }

  const shopCharges = await db
    .select()
    .from(charges)
    .where(eq(charges.shopId, shop.id))
    .orderBy(desc(charges.createdAt))
    .limit(10);

  return { shop, charges: shopCharges };
}

export type StoreDetail = NonNullable<Awaited<ReturnType<typeof getStore>>>;
