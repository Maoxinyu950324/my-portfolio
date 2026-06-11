import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://my-portfolio-blush-five-pz0bdpc6fg.vercel.app',
  image: {
    domains: [],
  },
});
