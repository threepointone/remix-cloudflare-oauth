import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { authenticator } from "../auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return authenticator.authenticate("cf-oauth", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
