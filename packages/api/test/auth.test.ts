import { describe, expect, it, vi } from "vitest";

import { createTokenCache } from "../src/auth";

describe("createTokenCache", () => {
  it("dùng lại JWT còn hạn, xin mới khi sắp hết hạn, gộp các lần gọi đồng thời", async () => {
    const now = Date.now() / 1000;
    const load = vi
      .fn()
      .mockResolvedValueOnce({ accessToken: "a", expiresAt: now + 30 })
      .mockResolvedValueOnce({ accessToken: "b", expiresAt: now + 900 });
    const cache = createTokenCache(load);
    expect(await cache.get()).toBe("a");
    // Còn 30 giây (< 60) → xin token mới; hai lần gọi cùng lúc chỉ tạo 1 request.
    const [first, second] = await Promise.all([cache.get(), cache.get()]);
    expect([first, second]).toEqual(["b", "b"]);
    expect(await cache.get()).toBe("b");
    expect(load).toHaveBeenCalledTimes(2);
  });
});
