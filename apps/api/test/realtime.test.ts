import { describe, expect, it } from "vitest";

import { matchesSubscription } from "../src/realtime";

const sub = { orgId: "org-1", centerId: "center-1" };

describe("matchesSubscription", () => {
  it("gửi thay đổi đúng cơ sở", () => {
    expect(
      matchesSubscription(
        {
          table: "attendance",
          op: "insert",
          org_id: "org-1",
          center_id: "center-1",
          id: "a",
        },
        sub,
      ),
    ).toBe(true);
    expect(
      matchesSubscription(
        {
          table: "attendance",
          op: "insert",
          org_id: "org-1",
          center_id: "center-2",
          id: "a",
        },
        sub,
      ),
    ).toBe(false);
  });

  it("bảng không gắn cơ sở thì lọc theo tổ chức", () => {
    expect(
      matchesSubscription(
        {
          table: "enrollments",
          op: "update",
          org_id: "org-1",
          center_id: null,
          id: "e",
        },
        sub,
      ),
    ).toBe(true);
    expect(
      matchesSubscription(
        {
          table: "enrollments",
          op: "update",
          org_id: "org-2",
          center_id: null,
          id: "e",
        },
        sub,
      ),
    ).toBe(false);
  });
});
