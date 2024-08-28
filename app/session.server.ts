// app/services/session.server.ts
import { createCookieSessionStorage } from "@remix-run/cloudflare";

declare global {
  const SESSION_SECRET: string | undefined;
}

if (!SESSION_SECRET) {
  throw new Error(
    "global SESSION_SECRET is not set, use --define SESSION_SECRET=<secret> or define.SESSION_SECRET=<secret> in wrangler.toml"
  );
}

// export the whole sessionStorage object
export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_cf_session", // use any name you want here
    sameSite: "lax", // this helps with CSRF
    path: "/", // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production", // enable this in prod only
  },
});

// you can also export the methods individually for your own usage
export let { getSession, commitSession, destroySession } = sessionStorage;
