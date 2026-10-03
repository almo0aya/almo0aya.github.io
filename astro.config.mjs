import { defineConfig } from 'astro/config';
import highlightBrand from './scripts/rehype-brand.mjs';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://almo0aya.online', trailingSlash: 'always', integrations: [sitemap()], markdown: { processor: satteri({ hastPlugins: [highlightBrand] }), shikiConfig: { theme: 'github-dark' } } });
