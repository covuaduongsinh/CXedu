import { describe, expect, it } from "vitest";

import { mintAccessToken, verifyAccessToken } from "../src/token";

describe("access token", () => {
  it("cấp và kiểm JWT cho PostgREST", async () => {
    const { accessToken, expiresAt } = await mintAccessToken({
      id: "11111111-1111-4111-8111-111111111111",
      email: "a@b.vn",
    });
    expect(expiresAt).toBeGreaterThan(Date.now() / 1000);
    await expect(verifyAccessToken(accessToken)).resolves.toMatchObject({
      sub: "11111111-1111-4111-8111-111111111111",
      role: "authenticated",
    });
    await expect(verifyAccessToken(`${accessToken}x`)).rejects.toThrow();
  });
});
