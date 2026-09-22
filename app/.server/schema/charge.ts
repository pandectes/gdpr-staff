import {
  bigint,
  date,
  datetime,
  double,
  mysqlEnum,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core';
import { BILLING_INTERVAL } from './shop';

export const CHARGE_STATUS = [
  'pending',
  'accepted',
  'declined',
  'active',
  'cancelled',
  'frozen',
  'expired',
] as const;

export const CHARGE_DISCOUNT_TYPE = ['none', 'coupon', 'custom', 'annual'] as const;

export const charges = mysqlTable('charges', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  plan: varchar('plan', { length: 255 }).notNull(),
  shopId: bigint('shop_id', { unsigned: true, mode: 'number' }).notNull(),
  chargeId: bigint('charge_id', { mode: 'number', unsigned: true }).notNull(),
  interval: mysqlEnum('interval', BILLING_INTERVAL).notNull(),
  status: mysqlEnum('status', CHARGE_STATUS).notNull(),
  price: double('price').notNull(),
  discount: double('discount').notNull(),
  discountType: mysqlEnum('discount_type', CHARGE_DISCOUNT_TYPE).notNull(),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
  activatedOn: date('activated_on'),
  billingOn: date('billing_on'),
  cancelledOn: date('cancelled_on'),
  trialEndsOn: date('trial_ends_on'),
});

export type Charge = typeof charges.$inferSelect;
