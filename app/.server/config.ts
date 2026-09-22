const gvar = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
};

const ovar = (name: string, fallback = ''): string => process.env[name] ?? fallback;

const IS_DEV = process.env.NODE_ENV !== 'production';

/** Without SES credentials we print the PIN to the server log instead of mailing it. */
export const hasSesCredentials =
  !!ovar('AWS_SES_ACCESS_KEY_ID') && !!ovar('AWS_SES_SECRET_ACCESS_KEY');

/** Emails allowed to sign in. Everything else is rejected before a PIN is ever generated. */
const STAFF_EMAILS = ovar('STAFF_EMAILS', 'nikos@pandectes.io,panos@pandectes.io')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const config = {
  isDev: IS_DEV,
  appName: ovar('APP_NAME', 'Pandectes Staff'),
  mysql: {
    host: gvar('MYSQL_HOST'),
    user: gvar('MYSQL_USER'),
    password: gvar('MYSQL_PASSWORD'),
    database: gvar('MYSQL_DATABASE'),
    port: +ovar('MYSQL_PORT', '3306'),
  },
  session: {
    secret: gvar('SESSION_SECRET'),
    /** How long a signed-in staff session lasts, in seconds. */
    maxAge: +ovar('SESSION_MAX_AGE', String(60 * 60 * 8)),
  },
  pin: {
    /** How long a mailed PIN stays valid, in seconds. */
    ttl: +ovar('PIN_TTL', '600'),
    maxAttempts: +ovar('PIN_MAX_ATTEMPTS', '5'),
  },
  staffEmails: STAFF_EMAILS,
  ses: {
    credentials: {
      accessKeyId: ovar('AWS_SES_ACCESS_KEY_ID'),
      secretAccessKey: ovar('AWS_SES_SECRET_ACCESS_KEY'),
    },
    // No default: a wrong region fails at send time with a confusing error, so demand it up
    // front once we know we are actually going to mail.
    region: hasSesCredentials ? gvar('AWS_SES_REGION') : '',
    apiVersion: '2010-12-01',
  },
  email: {
    noReply: ovar('EMAIL_NO_REPLY', 'no-reply@pandectes.io'),
  },
};
