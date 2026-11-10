# PEX Cloudflare Turnstile Gateway

This Worker serves the public GitHub Pages site through a Turnstile challenge and issues a signed, 24-hour HttpOnly session cookie after successful server-side verification.

## Important limitation

The original GitHub Pages address `https://pexshop.github.io` remains public and can be visited directly. This Worker protects only its own `workers.dev` address. It cannot make the GitHub Pages origin private or prevent bypasses without a custom domain/origin configuration under your control.

## Deploy

1. In Cloudflare Dashboard, open **Workers & Pages** and create a Worker named **pex-gate**.
2. Paste the contents of `src/index.js` into the Worker editor, or deploy this folder with Wrangler.
3. In Cloudflare Turnstile, create a widget. Add the hostname for your eventual Worker URL (the account's `workers.dev` hostname) to the widget's allowed hostnames. Copy its Site Key and Secret Key.
4. In the Worker, open **Settings → Variables and Secrets**:
   - Add plain text variable `TURNSTILE_SITEKEY` with the Turnstile Site Key.
   - Add Secret `TURNSTILE_SECRET` with the Turnstile Secret Key.
   - Add Secret `SESSION_SECRET` with a newly generated random value of at least 32 characters. Do not reuse a password.
5. Ensure plain variable `UPSTREAM_ORIGIN` is `https://pexshop.github.io`.
6. Save and Deploy. Open the Worker `workers.dev` URL in a private browser window and test the challenge, homepage, and static assets.

Never put Turnstile Secret Key or SESSION_SECRET in GitHub, HTML, or a public variable. The Cloudflare Web Analytics token is not a Turnstile secret.

## Wrangler

From this folder:
```sh
npx wrangler deploy
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put SESSION_SECRET
```
Set `TURNSTILE_SITEKEY` in the dashboard as a plain text variable.
