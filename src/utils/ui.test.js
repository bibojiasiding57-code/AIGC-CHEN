import { describe, expect, it } from "vitest";
import { getCopyFeedback, getSectionId } from "./ui";

describe("getSectionId", () => {
  it("removes the hash from an internal section link", () => {
    expect(getSectionId("#works")).toBe("works");
  });
});

describe("getCopyFeedback", () => {
  it("returns manual copy guidance after a clipboard failure", () => {
    expect(getCopyFeedback(false, true)).toBe("请手动复制邮箱");
  });
});
