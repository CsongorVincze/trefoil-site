// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4321',

  integrations: [
    mdx(),
    sitemap()
  ],

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },

  adapter: vercel(),
});