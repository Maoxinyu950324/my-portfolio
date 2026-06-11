import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://maoxinyu.online',
  image: {
    domains: [],
  },
  redirects: {
    '/admin': '/admin/index.html',
  },
});
