# APKMASON Fruit Energy

A cinematic, scroll-driven product reveal for a fictional energy drink. The page is a self-initiated portfolio experiment combining product storytelling, motion direction and front-end craft.

## Local development

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run build
```

## Deployment

The Vite base path is configured for `https://apkmason.dev/fruit/`. A push to the `main` branch runs the GitHub Pages workflow in `.github/workflows/deploy-pages.yml`.

In the GitHub repository settings, select **GitHub Actions** as the Pages source before the first deployment.

## Accessibility and performance

- Native scroll timing keeps the runtime dependency surface small.
- Videos load metadata first and are scrubbed only when their duration is available.
- `prefers-reduced-motion` presents a still final product frame instead of scroll scrubbing.
- Semantic sections, visible keyboard focus and a skip link keep the case study navigable.

The product and campaign are fictional. Video assets are part of this portfolio concept.
