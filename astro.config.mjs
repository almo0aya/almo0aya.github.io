import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://almo0aya.online', trailingSlash: 'always', integrations: [sitemap()], markdown: { shikiConfig: { theme: 'github-dark' } } });
