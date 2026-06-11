import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://my-portfolio.vercel.app',
  image: {
    domains: [],
  },
});
