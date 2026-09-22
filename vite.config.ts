import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Vite only exposes VITE_* to the client bundle; the server modules read process.env, so pull
  // the whole .env in here. In production the platform supplies these directly.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [tailwindcss(), reactRouter()],
  };
});
