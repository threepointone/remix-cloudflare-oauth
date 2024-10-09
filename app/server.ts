import { createRequestHandler, logDevReady } from "@remix-run/cloudflare";
import * as build from "@remix-run/dev/server-build";
import { WorkerEntrypoint } from "cloudflare:workers";

interface Env {}

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    env: Env;
  }
}

declare global {
  var process: {
    env: {
      NODE_ENV: "development" | "production" | "test";
      SESSION_SECRET: string;
      OAUTH_CLIENT_ID: string;
      OAUTH_CLIENT_SECRET: string;
      DEV_HOST: string;
      PROD_HOST: string;
    };
  };
}

const handleRemixRequest = createRequestHandler(build);

if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

export default class Worker extends WorkerEntrypoint<Env> {
  async fetch(request: Request) {
    return handleRemixRequest(request, {
      env: this.env,
    });
  }
}
