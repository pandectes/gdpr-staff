import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { config } from './config';
import * as schema from './schema';

// The staff panel only ever reads. Point MYSQL_USER at a read-only account.
const connection = mysql.createPool({ ...config.mysql, connectionLimit: 5 });

export const db = drizzle({ client: connection, schema, mode: 'default' });

export * from './schema';
