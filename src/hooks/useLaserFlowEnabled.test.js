import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useLaserFlowEnabled from "./useLaserFlowEnabled";

function installMatchMedia({ desktop, motion }) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query) => ({
      matches: query.includes("min-width") ? desktop : motion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useLaserFlowEnabled", () => {
  it("enables LaserFlow only on desktop with full motion", () => {
    installMatchMedia({ desktop: true, motion: true });
    const { result } = renderHook(() => useLaserFlowEnabled());
    expect(result.current).toBe(true);
  });

  it.each([
    { desktop: false, motion: true },
    { desktop: true, motion: false },
  ])("keeps LaserFlow disabled for $desktop/$motion", (matches) => {
    installMatchMedia(matches);
    const { result } = renderHook(() => useLaserFlowEnabled());
    expect(result.current).toBe(false);
  });
});
