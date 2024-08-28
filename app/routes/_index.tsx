import { Form, redirect, useLoaderData } from "@remix-run/react";

import type {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { authenticator, getBearerToken } from "../auth.server";
import type { User } from "../auth.server";

import CloudflareAPI from "cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    {
      name: "description",
      content: "Welcome to Remix!",
    },
  ];
};

export const loader: LoaderFunction = async ({
  request,
  context,
}: LoaderFunctionArgs) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/login",
  });

  // we have a helper function getBearerToken for getting a bearer token
  const bearerToken = await getBearerToken(request);

  if (!bearerToken) {
    return redirect("/login");
  }

  // as an example, let's get the user's workers with this token

  const cf = new CloudflareAPI({
    apiToken: bearerToken,
  });

  // let's just use the first account for now
  const workers = await cf.workers.scripts.list({
    account_id: user.accounts[0].id,
  });

  return Response.json({ email: user.email, workers: workers.result });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const { email, workers } = data as {
    email: string;
    workers: CloudflareAPI.Workers.Scripts.Script[];
  };
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <Form action="/logout" method="post">
        <button type="submit">Logout</button>
      </Form>
      Hi {email}!
      <br />
      Here's page 1 of your workers:
      <pre>{JSON.stringify(workers, null, 2)}</pre>
    </div>
  );
}
