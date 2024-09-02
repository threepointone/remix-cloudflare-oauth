import { Authenticator } from "remix-auth";
import { sessionStorage } from "./session.server";
import { OAuth2Strategy, TokenResponseBody } from "remix-auth-oauth2";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export type User = {
  id: string;
  email: string;
  tokens: Pick<
    TokenResponseBody,
    "access_token" | "refresh_token" | "expires_in"
  >;
  accounts: {
    id: string;
    name: string;
  }[];
};

/**
 * The scopes used by your application. It'll probably be a subset of these.
 */
const DefaultScopes = {
  "account:read":
    "See your account info such as account details, analytics, and memberships.",
  "user:read":
    "See your user info such as name, email address, and account memberships.",
  "workers:write":
    "See and change Cloudflare Workers data such as zones, KV storage, namespaces, scripts, and routes.",
  "workers_kv:write":
    "See and change Cloudflare Workers KV Storage data such as keys and namespaces.",
  "workers_routes:write":
    "See and change Cloudflare Workers data such as filters and routes.",
  "workers_scripts:write":
    "See and change Cloudflare Workers scripts, durable objects, subdomains, triggers, and tail data.",
  "workers_tail:read": "See Cloudflare Workers tail and script data.",
  "d1:write": "See and change D1 Databases.",
  "pages:write":
    "See and change Cloudflare Pages projects, settings and deployments.",
  "zone:read": "Grants read level access to account zone.",
  "ssl_certs:write": "See and manage mTLS certificates for your account",
  "constellation:write": "Manage Constellation projects/models",
  "ai:write": "See and change Workers AI catalog and assets",
  "queues:write": "See and change Cloudflare Queues settings and data",
  offline_access: "Grants refresh tokens for long-lived access.",
} as const;

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<User>(sessionStorage);

const strategy = new OAuth2Strategy<
  User,
  { provider: "cf-oauth" },
  { id_token: string }
>(
  {
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,

    authorizationEndpoint: "https://dash.cloudflare.com/oauth2/auth",
    tokenEndpoint: "https://dash.cloudflare.com/oauth2/token",
    redirectURI: `${
      process.env.NODE_ENV === "development"
        ? process.env.DEV_HOST
        : process.env.PROD_HOST
    }/oauth/cf/callback`,

    tokenRevocationEndpoint: "https://dash.cloudflare.com/oauth2/revoke", // optional

    scopes: Object.keys(DefaultScopes),

    authenticateWith: "http_basic_auth", // optional
  },
  async ({ tokens, profile, context, request }) => {
    // here you can use the params above to get the user and return it
    // what you do inside this and how you find the user is up to you
    let { access_token: accessToken, refresh_token: refreshToken } = tokens;

    const userRes = await fetch("https://api.cloudflare.com/client/v4/user", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      throw new Error("Failed to fetch user");
    }

    const { result: user } = await userRes.json<{
      result: {
        id: string;
        email: string;
      };
    }>();

    const accountsRes = await fetch(
      "https://api.cloudflare.com/client/v4/accounts",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!accountsRes.ok) {
      throw new Error("Failed to fetch accounts");
    }

    const { result: accounts } = await accountsRes.json<{
      result: {
        id: string;
        name: string;
      }[];
    }>();

    // TODO: check result.id and result.email are actually strings
    if (typeof user.id !== "string") {
      throw new Error("Invalid user id");
    }

    if (typeof user.email !== "string") {
      throw new Error("Invalid user email");
    }

    if (!Array.isArray(accounts)) {
      throw new Error("Invalid accounts");
    }

    for (const account of accounts) {
      if (typeof account.id !== "string") {
        throw new Error("Invalid account id");
      }

      if (typeof account.name !== "string") {
        throw new Error("Invalid account name");
      }
    }

    return {
      id: user.id,
      email: user.email,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: Date.now() + (tokens.expires_in || 3600) * 1000,
      },
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
      })),
    };
  }
);

authenticator.use(strategy, "cf-oauth");

export async function getBearerToken(
  withRequestContext: Request
): Promise<string | undefined> {
  let user = await authenticator.isAuthenticated(withRequestContext);
  if (!user) {
    return;
  }

  if (user.tokens.expires_in! < Date.now()) {
    // TODO: refresh token
    // unfortunately currently the refresh token flow isn't working as expected
    // so for now we'll just return and let the user login again

    // refresh token
    // assert(
    //   user.tokens.refresh_token,
    //   "The token has expired, but could not refresh token, no refresh token available. Need to login again."
    // );
    // const session = await sessionStorage.getSession(
    //   withRequestContext.headers.get("cookie")
    // );

    // console.log("refreshing token", user.tokens.refresh_token);
    // const tokens = await strategy.refreshToken(user.tokens.refresh_token);

    // session.set(authenticator.sessionKey, {
    //   ...user,
    //   tokens: {
    //     access_token: tokens.access_token,
    //     refresh_token: tokens.refresh_token,
    //     expires_in: Date.now() + (tokens.expires_in || 3600) * 1000,
    //   },
    // });

    // // and reset the user object
    // user = await authenticator.isAuthenticated(withRequestContext);
    // if (!user) {
    //   throw new Error("User not authenticated");
    // }

    return;
  }

  return user.tokens.access_token;
}
