import { ActionFunctionArgs } from "@remix-run/server-runtime";
import { authenticator } from "../auth.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return authenticator.logout(request, { redirectTo: "/login" });
};
