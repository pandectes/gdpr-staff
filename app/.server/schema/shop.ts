import {
  bigint,
  boolean,
  char,
  date,
  index,
  mysqlEnum,
  mysqlTable,
  tinyint,
  varchar,
} from 'drizzle-orm/mysql-core';

export const SHOP_STATUS = ['installed', 'uninstalled'] as const;
export const ACCESS_TOKEN_STATUS = ['valid', 'invalid'] as const;
export const PLAN = ['basic', 'plus', 'premium', 'enterprise'] as const;
export const BILLING_INTERVAL = ['ANNUAL', 'EVERY_30_DAYS'] as const;
export const VERSION = ['v1', 'v2', 'v2.1', 'v2.2', 'v3.0', 'v4.0'] as const;
export const ASSET_STATE = ['inactive', 'pending', 'active'] as const;

/**
 * A read-only mirror of the columns of the GDPR app's `shops` table that the staff panel shows.
 * The source of truth stays in the GDPR app — add columns here as the panel grows, never migrate
 * from this repo.
 */
export const shops = mysqlTable(
  'shops',
  {
    id: bigint('id', { unsigned: true, mode: 'number' }).notNull().autoincrement().primaryKey(),
    shopifyId: bigint('shopify_id', { unsigned: true, mode: 'number' }).notNull(),
    status: mysqlEnum('status', SHOP_STATUS).notNull(),
    closed: boolean('closed').notNull(),
    version: mysqlEnum('version', VERSION).notNull(),
    bannerV2: boolean('banner_v2').notNull(),
    adminMode: boolean('admin_mode').notNull(),

    // identity
    shopifyName: varchar('shopify_name', { length: 255 }).notNull(),
    shop: varchar('shopify_myshopify_domain', { length: 255 }).notNull(),
    domain: varchar('shopify_domain', { length: 255 }).notNull(),
    shopifyPlanName: varchar('shopify_plan_name', { length: 255 }),
    shopifyShopOwner: varchar('shopify_shop_owner', { length: 255 }),
    shopifyEmail: varchar('shopify_email', { length: 255 }),
    shopifyCustomerEmail: varchar('shopify_customer_email', { length: 255 }),
    shopifyCountryCode: char('shopify_country_code', { length: 2 }),
    shopifyCountryName: varchar('shopify_country_name', { length: 255 }),
    shopifyCity: varchar('shopify_city', { length: 255 }),
    shopifyIanaTimezone: varchar('shopify_iana_timezone', { length: 255 }),
    shopifyPrimaryLocale: char('shopify_primary_locale', { length: 2 }),
    shopifyCreatedAt: date('shopify_created_at'),

    // access
    accessTokenStatus: mysqlEnum('access_token_status', ACCESS_TOKEN_STATUS),
    accessScopes: varchar('access_scopes', { length: 200 }),

    // billing
    plan: mysqlEnum('plan', PLAN),
    activeChargeId: bigint('active_charge_id', { unsigned: true, mode: 'number' }),
    billingInterval: mysqlEnum('billing_interval', BILLING_INTERVAL),
    legacyPlan: tinyint('legacy_plan', { unsigned: true }).notNull(),
    plusTrialEndsOn: date('plus_trial_ends_on'),
    premiumTrialEndsOn: date('premium_trial_ends_on'),
    enterpriseTrialEndsOn: date('enterprise_trial_ends_on'),

    // deployment
    onboarding: boolean('onboarding').notNull(),
    scriptTags: boolean('script_tags').notNull(),
    showPoweredBy: boolean('show_powered_by').notNull(),
    themeName: varchar('theme_name', { length: 255 }),
    themeDetected: varchar('theme_detected', { length: 255 }),
    settingsAssetUrl: varchar('settings_asset_url', { length: 255 }),
    blockerAssetUrl: varchar('blocker_asset_url', { length: 255 }),
    headlessStore: mysqlEnum('headless_store', ASSET_STATE).notNull(),
    checkoutAssets: mysqlEnum('checkout_assets', ASSET_STATE).notNull(),
    referral: varchar('referral', { length: 32 }),

    // timestamps (unix seconds)
    tsInstalled: bigint('ts_installed', { mode: 'number', unsigned: true }).notNull(),
    tsLastInstalled: bigint('ts_last_installed', { mode: 'number', unsigned: true }).notNull(),
    tsLastLogin: bigint('ts_last_login', { mode: 'number', unsigned: true }),
    tsUninstalled: bigint('ts_uninstalled', { mode: 'number', unsigned: true }),
    tsClosed: bigint('ts_closed', { mode: 'number', unsigned: true }),
    tsPlanChanged: bigint('ts_plan_changed', { mode: 'number', unsigned: true }),
    tsScanned: bigint('ts_scanned', { mode: 'number', unsigned: true }),
    tsPublished: bigint('ts_published', { mode: 'number', unsigned: true }),
    tsAccessTokenChecked: bigint('ts_access_token_checked', { mode: 'number', unsigned: true }),
  },
  (table) => ({
    domainIdx: index('domain_idx').on(table.domain),
    statusIdx: index('status_idx').on(table.status),
  }),
);

export type Shop = typeof shops.$inferSelect;
