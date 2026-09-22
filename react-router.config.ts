import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  /**
   * React Router rejects an action whose `origin` header does not match the URL it computed for
   * the request. Behind Heroku's router the browser sends `https://` while `react-router-serve`
   * sees `req.protocol === 'http'`, so every form submission — including sign-in — came back 400.
   * Naming our own hosts here lets the real ones through while the check still blocks foreign
   * origins.
   */
  allowedActionOrigins: ['staff.pandect.es', 'staff-779fa044f3b6.herokuapp.com'],
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
    unstable_optimizeDeps: true,
  },
} satisfies Config;
