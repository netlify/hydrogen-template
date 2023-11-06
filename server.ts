// Virtual entry point for the app
import * as remixBuild from '@remix-run/dev/server-build';

import {
  cartGetIdDefault,
  cartSetIdDefault,
  createCartHandler,
  createStorefrontClient,
  storefrontRedirect,
} from '@shopify/hydrogen';

import {
  createCookieSessionStorage,
  broadcastDevReady,
  type SessionStorage,
  type Session,
} from '@netlify/remix-runtime';

import {createRequestHandler} from '@netlify/remix-edge-adapter';
import type {Context} from '@netlify/edge-functions';

export default async function handler(
  request: Request,
  context: Context,
): Promise<Response | void> {
  try {
    const env = Netlify.env.toObject() as unknown as Env;

    if (
      !env.SESSION_SECRET &&
      env.PUBLIC_STORE_DOMAIN &&
      env.PUBLIC_STORE_DOMAIN !== 'mock.shop'
    ) {
      throw new Error('SESSION_SECRET environment variable is not set');
    }

    const session = await HydrogenSession.init(request, [
      env.SESSION_SECRET ?? 'mock token',
    ]);

    /**
     * Create Hydrogen's Storefront client.
     */
    const {storefront} = createStorefrontClient({
      i18n: {language: 'EN', country: 'US'},
      publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
      storeDomain: env.PUBLIC_STORE_DOMAIN ?? 'mock.shop',
      storefrontId: env.PUBLIC_STOREFRONT_ID,
      storefrontHeaders: getStorefrontHeaders(request, context),
    });

    /*
     * Create a cart handler that will be used to
     * create and update the cart in the session.
     */
    const cart = createCartHandler({
      storefront,
      getCartId: cartGetIdDefault(request.headers),
      setCartId: cartSetIdDefault(),
      cartQueryFragment: CART_QUERY_FRAGMENT,
    });

    const loadContext = {
      ...context,
      session,
      storefront,
      cart,
      env,
    };

    /**
     * Create a Remix request handler and pass
     * Hydrogen's Storefront client to the loader context.
     */
    const handleRequest = createRequestHandler({
      build: remixBuild,
      mode: process.env.NODE_ENV,
      getLoadContext: () => loadContext,
    });

    const response = await handleRequest(request, loadContext);

    if (!response) {
      return;
    }

    if (response.status === 404) {
      /**
       * Check for redirects only when there's a 404 from the app.
       * If the redirect doesn't exist, then `storefrontRedirect`
       * will pass through the 404 response.
       */
      return storefrontRedirect({request, response, storefront});
    }

    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return new Response('An unexpected error occurred', {status: 500});
  }
}

type StorefrontHeaders = {
  requestGroupId: string | null;
  buyerIp: string | null;
  cookie: string | null;
  purpose: string | null;
};

export function getStorefrontHeaders(
  request: Request,
  context: Context,
): StorefrontHeaders {
  const headers = request.headers;
  return {
    requestGroupId: headers.get('request-id'),
    buyerIp: context.ip,
    cookie: headers.get('cookie'),
    purpose: headers.get('purpose'),
  };
}

/**
 * This is a custom session implementation for your Hydrogen shop.
 * Feel free to customize it to your needs, add helper methods, or
 * swap out the cookie-based implementation with something else!
 */
export class HydrogenSession {
  #sessionStorage;
  #session;

  constructor(sessionStorage: SessionStorage, session: Session) {
    this.#sessionStorage = sessionStorage;
    this.#session = session;
  }

  static async init(request: Request, secrets: string[]) {
    const storage = createCookieSessionStorage({
      cookie: {
        name: 'session',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets,
      },
    });

    const session = await storage.getSession(request.headers.get('Cookie'));

    return new this(storage, session);
  }

  get has() {
    return this.#session.has;
  }

  get get() {
    return this.#session.get;
  }

  get flash() {
    return this.#session.flash;
  }

  get unset() {
    return this.#session.unset;
  }

  get set() {
    return this.#session.set;
  }

  destroy() {
    return this.#sessionStorage.destroySession(this.#session);
  }

  commit() {
    return this.#sessionStorage.commitSession(this.#session);
  }
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/cart
const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height

        }
        product {
          handle
          title
          id
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
  fragment CartApiQuery on Cart {
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalDutyAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
` as const;

if (process.env.NODE_ENV === 'development') {
  // Tell remix dev that the server is ready
  broadcastDevReady(remixBuild);
}

export const config = {
  cache: 'manual',
  path: '/*',
  // Let the CDN handle requests for static assets, i.e. ^/_assets/*$
  //
  // Add other exclusions here, e.g. "^/api/*$" for custom Netlify functions or
  // custom Netlify Edge Functions
  excludedPath: ['/build/*', '/favicon.ico'],
};
