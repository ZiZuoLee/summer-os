import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { verifyTurnstileToken } from "@/lib/turnstile";

describe("Turnstile server verification", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it("fails closed in production when the secret is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(verifyTurnstileToken("token")).resolves.toBe(false);
  });

  it("allows the explicit local/test bypass only outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");

    await expect(verifyTurnstileToken(null)).resolves.toBe(true);
  });

  it("does not contact Cloudflare without a submitted token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "server-secret");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstileToken(null)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns false for an unsuccessful provider response", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "server-secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(verifyTurnstileToken("one-time-token")).resolves.toBe(false);
  });

  it("fails closed when the provider request or response parsing throws", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "server-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("provider unavailable")),
    );

    await expect(verifyTurnstileToken("one-time-token")).resolves.toBe(false);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("invalid json")),
      }),
    );
    await expect(verifyTurnstileToken("one-time-token")).resolves.toBe(false);
  });

  it("accepts only an explicit success result", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "server-secret");
    const json = vi.fn().mockResolvedValue({ success: true });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json });
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstileToken("one-time-token")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.body).toBeInstanceOf(URLSearchParams);
    expect(String(request.body)).toContain("response=one-time-token");
  });
});
