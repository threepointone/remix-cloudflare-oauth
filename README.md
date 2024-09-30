## remix-cloudflare-oauth

A remix template setup with Cloudflare OAuth.

### Setup

`cp .env.example .env`

In `.env`:

- fill in the `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` with your Cloudflare OAuth credentials.
- fill in `SESSION_SECRET` with a random string.
- fill in the `DEV_HOST` and `PROD_HOST` with your development and production hosts

### Running the app

`npm run dev`

### Deploying

`npm run deploy`

#### How do I make an "authorized" api call?

See the example in `/routes/_index.ts`.

#### Can I use the new vite hotness?

Not yet, we still need the environments thing, but we should be able to move to it when it's ready.

### TODO:

- refresh token when expired
- actually revoke token on logout
- STAGING_HOST?
