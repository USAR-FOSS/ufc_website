import { NextResponse, type NextRequest } from "next/server";
import { oidcSettings } from "@/server/auth/oidc";

/**
 * After the site's own session has been cleared, ends the shared session too, so signing out here signs the person out of the club's apps.
 * The service asks them to confirm and brings them back to the home page. With the shared sign in off it just goes home.
 */
export function GET(request: NextRequest) {
  const settings = oidcSettings();
  const origin = process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ?? request.nextUrl.origin;
  if (!settings) return NextResponse.redirect(`${origin}/`);

  const url = new URL(`${settings.issuer}/session/end`);
  url.searchParams.set("client_id", settings.clientId);
  url.searchParams.set("post_logout_redirect_uri", `${origin}/`);
  return NextResponse.redirect(url);
}
