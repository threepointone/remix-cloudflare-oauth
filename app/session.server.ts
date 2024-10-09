// app/services/session.server.ts
import { createCookieSessionStorage } from "@remix-run/cloudflare";

// export the whole sessionStorage object
export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_cf_session", // use any name you want here
    sameSite: "lax", // this helps with CSRF
    path: "/", // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production", // enable this in prod only
  },
});

// you can also export the methods individually for your own usage
export let { getSession, commitSession, destroySession } = sessionStorage;
