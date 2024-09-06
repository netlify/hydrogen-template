# Hydrogen template: Skeleton

Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to dovetail with [Remix](https://remix.run/), Shopify’s full stack web framework. This template contains a **minimal setup** of components, queries and tooling to get started with Hydrogen.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify/hydrogen-template)

- [Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
- [Get familiar with Remix](https://remix.run/docs/)

## What's included

- Remix 2
- Hydrogen
- Shopify CLI
- Configured deployment to Netlify, with Server-Side Rendering (SSR) via [Netlify Edge
  Functions](https://docs.netlify.com/edge-functions/overview/)
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes

## Getting started

We highly recommend using this template to deploy a Hydrogen site to Netlify.

**Requirements:**

- Node.js version 18.0.0 or higher
- Netlify CLI 17.0.0 or higher

```bash
npm install -g netlify-cli@latest
```

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify/hydrogen-template)

To create a new project, either click the "Deploy to Netlify" button above, or run the following command:

```bash
npm create @shopify/hydrogen@latest -- --template https://github.com/netlify/hydrogen-template
```

Then follow the instructions in `.env.example` and you're ready to start developing.

## Local development

```bash
npm run dev
```

## Building for production

```bash
npm run build
```

## FAQ and Troubleshooting

## How do I configure my Hydrogen session / storefront client / customer account client / cart handler?

See `app/lib/context.ts` and the Hydrogen documentation.

## How do I augment the Remix context?

Add your custom context to the object returned by the `createAppLoadContext` function in
`app/lib/context.ts` and ensure the return type is updated (e.g. `HydrogenContext & {foo: string}`).

### How do I configure a real Shopify store in local dev?

See `.env.example` and
[these Shopify instructions](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started).

### I get a 500 error on the `/accounts` pages. How do I configure real Shopify customer accounts in local dev?

See [these Shopify instructions](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/hydrogen).

### Static assets not loading in local dev

If your `.js` and `.css` files are failing to load in local development (with 404 responses), you
may be running into an issue that occurs when `netlify dev` is run after having run a build (via
`netlify build`, `netlify serve`, `npm run build`, or `remix vite:build`). This is a known issue
that Netlify is working on.

To fix this, delete the conflicting built functions before running your dev server:

```bash
rm -rf .netlify/edge-functions*
npm run dev
```

### `shopify hydrogen preview` fails with `Cannot find module '@shopify/mini-oxygen'`

The `shopify hydrogen preview` command has a misleading name. It previews your site in a local
simulation of the Oxygen hosting platform. It therefore isn't compatible with a site intended to be
deployed to Netlify.

Instead, use the [Netlify CLI](https://docs.netlify.com/cli/get-started/) (e.g. `netlify serve`).
