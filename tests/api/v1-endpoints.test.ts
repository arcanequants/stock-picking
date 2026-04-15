import { describe, it, expect, beforeAll } from "vitest";

const BASE = "https://www.vectorialdata.com/api/v1";

let apiKey: string;

async function get(path: string, auth = false) {
  const headers: Record<string, string> = {};
  if (auth) headers["Authorization"] = `Bearer ${apiKey}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  const body = await res.json();
  return { status: res.status, body, headers: res.headers };
}

async function post(path: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { status: res.status, body };
}

// ─── Public endpoints (no auth) ───

describe("Public endpoints", () => {
  it("GET /info — returns service info", async () => {
    const { status, body } = await get("/info");
    expect(status).toBe(200);
    expect(body.name).toBe("Vectorial Data");
    expect(body.pricing).toBeDefined();
    expect(body.pricing.free).toBeDefined();
    expect(body.pricing.pro).toBeDefined();
    expect(body.track_record).toBeDefined();
    expect(body.track_record.total_positions).toBeGreaterThan(0);
  });

  it("GET /verify/picks — returns hash chain", async () => {
    const { status, body } = await get("/verify/picks");
    expect(status).toBe(200);
    expect(body.valid).toBe(true);
    expect(body.chain_length).toBeGreaterThan(0);
    expect(body.algorithm).toContain("SHA-256");
    expect(Array.isArray(body.picks)).toBe(true);
    expect(body.picks[0]).toHaveProperty("hash");
    expect(body.picks[0]).toHaveProperty("ticker");
  });

  it("GET /verify/pick/UBS — returns verified pick", async () => {
    const { status, body } = await get("/verify/pick/UBS");
    expect(status).toBe(200);
    expect(body.verified).toBe(true);
    expect(body.pick.ticker).toBe("UBS");
    expect(body.pick.hash).toBeDefined();
    expect(body.pick.previous_hash).toBeDefined();
    expect(body.algorithm).toContain("SHA-256");
  });

  it("GET /verify/pick/XXXINVALID — returns 404", async () => {
    const { status, body } = await get("/verify/pick/XXXINVALID");
    expect(status).toBe(404);
    expect(body.error).toBeDefined();
  });

  it("GET /x402/info — returns x402 protocol info", async () => {
    const { status, body } = await get("/x402/info");
    expect(status).toBe(200);
    expect(body.protocol).toBe("x402");
    expect(Array.isArray(body.endpoints)).toBe(true);
    expect(body.endpoints.length).toBeGreaterThan(0);
  });
});

// ─── Auth registration ───

describe("Auth registration", () => {
  it("POST /auth/register — creates API key", async () => {
    const { status, body } = await post("/auth/register", {
      email: `test-${Date.now()}@vectorialdata-test.com`,
      name: "Vitest API Test",
    });
    expect(status).toBe(200);
    expect(body.data.api_key).toBeDefined();
    expect(body.data.api_key).toMatch(/^vd_live_/);
    expect(body.data.tier).toBe("free");
    expect(body.data.daily_limit).toBe(10);

    apiKey = body.data.api_key;
  });
});

// ─── Edge cases ───

describe("Edge cases", () => {
  it("Request without auth header → 401", async () => {
    const res = await fetch(`${BASE}/picks`);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toContain("Missing API key");
  });

  it("Request with invalid key → 401", async () => {
    const res = await fetch(`${BASE}/picks`, {
      headers: { Authorization: "Bearer vd_live_invalid_key_12345" },
    });
    const body = await res.json();
    expect(res.status).toBe(401);
  });

  it("GET /research/XXXINVALID → 404 or 401", async () => {
    // Without auth — should still get a clear error
    const res = await fetch(`${BASE}/research/XXXINVALID`);
    expect([401, 404]).toContain(res.status);
  });
});

// ─── Authenticated endpoints (free tier) ───

describe("Free tier endpoints", () => {
  it("GET /picks — returns max 3 picks", async () => {
    const { status, body } = await get("/picks", true);
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(3);
    expect(body.meta.tier).toBe("free");
    expect(body.meta.requests_remaining).toBeDefined();
    // Validate pick structure
    const pick = body.data[0];
    expect(pick).toHaveProperty("ticker");
    expect(pick).toHaveProperty("price_at_pick");
    expect(pick).toHaveProperty("return_pct");
  });

  it("GET /picks/latest — returns single pick", async () => {
    const { status, body } = await get("/picks/latest", true);
    expect(status).toBe(200);
    expect(body.data).toHaveProperty("ticker");
    expect(body.data).toHaveProperty("pick_number");
    expect(body.data).toHaveProperty("return_pct");
    expect(body.meta.tier).toBe("free");
  });

  it("GET /portfolio — returns portfolio summary", async () => {
    const { status, body } = await get("/portfolio", true);
    expect(status).toBe(200);
    expect(typeof body.data.total_return_pct).toBe("number");
    expect(body.data.total_positions).toBeGreaterThan(0);
    expect(body.meta.tier).toBe("free");
  });

  it("GET /portfolio/positions — returns max 3 positions (free)", async () => {
    const { status, body } = await get("/portfolio/positions", true);
    expect(status).toBe(200);
    expect(body.data.positions).toBeDefined();
    expect(Array.isArray(body.data.positions)).toBe(true);
    expect(body.data.positions.length).toBeLessThanOrEqual(3);
    expect(body.data.total_positions).toBeGreaterThan(0);
    expect(body.meta.tier).toBe("free");
  });

  it("GET /portfolio/history — returns max 7 days (free)", async () => {
    const { status, body } = await get("/portfolio/history", true);
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(7);
    expect(body.meta.tier).toBe("free");
  });

  it("GET /stocks — returns stock list", async () => {
    const { status, body } = await get("/stocks", true);
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    const stock = body.data[0];
    expect(stock).toHaveProperty("ticker");
    expect(stock).toHaveProperty("name");
    expect(stock).toHaveProperty("sector");
  });

  it("GET /research/UBS — free tier gets summary_short only", async () => {
    const { status, body } = await get("/research/UBS", true);
    expect(status).toBe(200);
    expect(body.data.ticker).toBe("UBS");
    expect(body.data.summary_short).toBeDefined();
    // Free tier should NOT have full financials
    expect(body.data.financials).toBeUndefined();
    expect(body.meta.tier).toBe("free");
  });

  it("GET /sectors + /regions — allocation endpoints work", async () => {
    // Combined to stay within 10-request free tier limit
    const sectors = await get("/sectors", true);
    expect(sectors.status).toBe(200);
    expect(Array.isArray(sectors.body.data)).toBe(true);
    expect(sectors.body.data[0]).toHaveProperty("sector");
    expect(sectors.body.data[0]).toHaveProperty("pct_of_portfolio");

    const regions = await get("/regions", true);
    expect(regions.status).toBe(200);
    expect(Array.isArray(regions.body.data)).toBe(true);
    expect(regions.body.data[0]).toHaveProperty("region");
    expect(regions.body.data[0]).toHaveProperty("pct_of_portfolio");
  });

  it("GET /events — returns max 3 events without explanations", async () => {
    const { status, body } = await get("/events", true);
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(3);
    if (body.data.length > 0) {
      expect(body.data[0].explanation).toBeUndefined();
    }
  });

  // NOTE: /digest/latest not tested — requires 11th request, exceeds free tier limit of 10

});
