import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

const protectedPrefixes = [
  "/today",
  "/calendar",
  "/check-in",
  "/analytics",
  "/ielts",
  "/gre",
  "/weekly-review",
  "/plan",
  "/settings",
  "/export",
  "/api/export",
  "/onboarding",
];

// A recovery link creates an authenticated recovery session before sending the
// user to /update-password, so that route must remain reachable while signed in.
const authPaths = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsAuth = protectedPrefixes.some((prefix) => path.startsWith(prefix));
  if (!isSupabaseConfigured()) {
    const demoResponse = NextResponse.next();
    if (needsAuth)
      demoResponse.headers.set("Cache-Control", "private, no-store, max-age=0");
    return demoResponse;
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    publicEnv.url!,
    publicEnv.publishableKey!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  if (needsAuth && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && authPaths.includes(path)) {
    const todayUrl = request.nextUrl.clone();
    todayUrl.pathname = "/today";
    todayUrl.search = "";
    return NextResponse.redirect(todayUrl);
  }

  if (needsAuth)
    response.headers.set("Cache-Control", "private, no-store, max-age=0");

  return response;
}
