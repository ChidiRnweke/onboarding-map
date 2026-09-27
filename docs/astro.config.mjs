import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// The docs live under the repository's GitHub Pages path.
const SITE = 'https://chidirnweke.github.io';
const BASE = '/onboarding-map';

/**
 * Astro does not prefix `base` onto internal links written in Markdown, and
 * Starlight only does so for its own navigation. Root-absolute links (`/foo`)
 * in a page therefore have to become `/onboarding-map/foo` or they 404 on
 * GitHub Pages. Components (LinkCard, our Hero) add the base themselves, so
 * anything already under BASE is left alone.
 */
const rehypeBaseLinks = () => (tree) => {
  const walk = (node) => {
    if (node.type === 'element' && node.properties) {
      for (const attr of ['href', 'src']) {
        const value = node.properties[attr];
        if (
          typeof value === 'string' &&
          value.startsWith('/') &&
          !value.startsWith('//') &&
          value !== BASE &&
          !value.startsWith(`${BASE}/`)
        ) {
          node.properties[attr] = `${BASE}${value}`;
        }
      }
    }
    if (Array.isArray(node.children)) for (const child of node.children) walk(child);
  };
  walk(tree);
};

export default defineConfig({
  site: SITE,
  base: BASE,
  markdown: { rehypePlugins: [rehypeBaseLinks] },
  integrations: [
    starlight({
      title: 'onboarding-map',
      description:
        'An onboarding map for any subject: a territory to recognise, a route to follow, written by your coding agent.',
      favicon: '/favicon.svg',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/ChidiRnweke/onboarding-map',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/ChidiRnweke/onboarding-map/edit/main/docs/',
      },
      customCss: ['./src/styles/tokens.css', './src/styles/theme.css'],
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
        Hero: './src/components/Hero.astro',
        Footer: './src/components/Footer.astro',
      },
      expressiveCode: {
        styleOverrides: { borderRadius: '8px' },
      },
      sidebar: [
        {
          label: 'User guide',
          items: [
            'user-guide/overview',
            'user-guide/how-it-works',
            'user-guide/getting-started',
            'user-guide/authoring-a-map',
            'user-guide/examples',
            'user-guide/working-with-your-agent',
            'user-guide/deploying-your-map',
          ],
        },
        {
          label: 'Reference',
          items: [
            'reference/model',
            'reference/cli',
            'reference/labels',
            'reference/schema',
            {
              label: 'Agent workflows',
              items: ['reference/new-map', 'reference/edit-map', 'reference/refresh-stale'],
            },
          ],
        },
        {
          label: 'Contributor guide',
          items: [
            'contributor-guide/architecture',
            'contributor-guide/development',
            'contributor-guide/pull-requests',
            'contributor-guide/releases',
            'contributor-guide/verifying',
            'contributor-guide/docs-site',
          ],
        },
      ],
    }),
  ],
});
