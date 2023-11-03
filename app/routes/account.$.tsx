import {redirect, type LoaderFunctionArgs} from '@netlify/remix-runtime';

export async function loader({context}: LoaderFunctionArgs) {
  if (await context.session.get('customerAccessToken')) {
    return redirect('/account');
  }
  return redirect('/account/login');
}
