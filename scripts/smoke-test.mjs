#!/usr/bin/env node

const rawBaseUrl = process.argv[2];

if (!rawBaseUrl) {
  console.error(
    "Usage: node scripts/smoke-test.mjs https://project.vercel.app",
  );
  process.exit(2);
}

let baseUrl;
try {
  baseUrl = new URL(rawBaseUrl);
} catch {
  console.error("The smoke-test target must be an absolute URL.");
  process.exit(2);
}

const isLocal = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);
if (
  baseUrl.protocol !== "https:" &&
  !(isLocal && baseUrl.protocol === "http:")
) {
  console.error("Refusing to smoke-test a non-HTTPS remote target.");
  process.exit(2);
}

baseUrl.pathname = "/";
baseUrl.search = "";
baseUrl.hash = "";

const checks = [
  { path: "/", kind: "html" },
  { path: "/login", kind: "html" },
  { path: "/privacy", kind: "html" },
  { path: "/offline", kind: "html" },
  { path: "/api/health", kind: "health" },
  { path: "/manifest.webmanifest", kind: "manifest" },
  { path: "/sw.js", kind: "javascript" },
];

const failures = [];

function requireHeader(response, path, name, predicate, expected) {
  const value = response.headers.get(name) ?? "";
  if (!predicate(value)) {
    failures.push(
      `${path}: ${name} must ${expected}; received ${value || "<missing>"}`,
    );
  }
}

for (const check of checks) {
  const url = new URL(check.path, baseUrl);
  let response;

  try {
    response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "summer-os-read-only-smoke/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    failures.push(
      `${check.path}: request failed (${error instanceof Error ? error.message : "unknown error"})`,
    );
    continue;
  }

  if (!response.ok) {
    failures.push(`${check.path}: expected 2xx, received ${response.status}`);
    continue;
  }

  const finalUrl = new URL(response.url);
  if (finalUrl.origin !== baseUrl.origin) {
    failures.push(
      `${check.path}: redirected to unexpected origin ${finalUrl.origin}`,
    );
  }

  if (check.kind === "html") {
    requireHeader(
      response,
      check.path,
      "content-type",
      (value) => value.includes("text/html"),
      "be HTML",
    );
    requireHeader(
      response,
      check.path,
      "x-content-type-options",
      (value) => value.toLowerCase() === "nosniff",
      "equal nosniff",
    );
    requireHeader(
      response,
      check.path,
      "referrer-policy",
      (value) => value.length > 0,
      "be present",
    );
    requireHeader(
      response,
      check.path,
      "content-security-policy",
      (value) => value.length > 0,
      "be present",
    );
    if (!isLocal) {
      requireHeader(
        response,
        check.path,
        "strict-transport-security",
        (value) => value.length > 0,
        "be present on HTTPS production",
      );
    }
    await response.arrayBuffer();
  } else if (check.kind === "health") {
    requireHeader(
      response,
      check.path,
      "cache-control",
      (value) => value.toLowerCase().includes("no-store"),
      "include no-store",
    );
    try {
      const body = await response.json();
      if (body?.status !== "ok") {
        failures.push(`${check.path}: health status was not ok`);
      }
    } catch {
      failures.push(`${check.path}: response was not valid JSON`);
    }
  } else if (check.kind === "manifest") {
    try {
      const body = await response.json();
      if (!body?.name || body?.display !== "standalone") {
        failures.push(
          `${check.path}: manifest must have a name and standalone display mode`,
        );
      }
    } catch {
      failures.push(`${check.path}: response was not valid JSON`);
    }
  } else {
    requireHeader(
      response,
      check.path,
      "content-type",
      (value) => /javascript|ecmascript/.test(value),
      "be JavaScript",
    );
    await response.arrayBuffer();
  }

  console.log(`PASS ${check.path} ${response.status}`);
}

if (failures.length > 0) {
  console.error("\nSmoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\nRead-only public smoke test passed for ${baseUrl.origin}.`);
console.log(
  "Complete the authenticated canary and RLS checks from DEPLOYMENT.md before release approval.",
);
