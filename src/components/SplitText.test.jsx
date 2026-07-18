import { render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const animation = vi.hoisted(() => ({
  fromTo: vi.fn(() => ({ kill: vi.fn() })),
  getAll: vi.fn(() => []),
  registerPlugin: vi.fn(),
  revert: vi.fn(),
  splitCalls: [],
  throwOnSplit: false,
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: animation.fromTo,
    registerPlugin: animation.registerPlugin,
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { getAll: animation.getAll },
}));

vi.mock("gsap/SplitText", () => ({
  SplitText: class MockSplitText {
    constructor(element, options) {
      if (animation.throwOnSplit) throw new Error("split unavailable");
      animation.splitCalls.push({ element, options });
      this.revert = animation.revert;
      const chars = [...element.textContent].map((character) => {
        const node = document.createElement("span");
        node.className = "split-char";
        node.textContent = character;
        return node;
      });
      element.replaceChildren(...chars);
      options.onSplit({ chars, words: [], lines: [] });
    }
  },
}));

vi.mock("@gsap/react", async () => {
  const React = await import("react");
  return {
    useGSAP(callback, { dependencies = [] }) {
      React.useEffect(callback, dependencies);
    },
  };
});

import SplitText from "./SplitText";

function installMotionPreference(reduced) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduced,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  animation.fromTo.mockClear();
  animation.getAll.mockReturnValue([]);
  animation.revert.mockClear();
  animation.splitCalls.length = 0;
  animation.throwOnSplit = false;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SplitText", () => {
  it("keeps the split hero title on one line at the mobile breakpoint", () => {
    const css = readFileSync(`${process.cwd()}/src/styles.css`, "utf8");
    const mobileRules = css.slice(css.indexOf("@media (max-width: 760px)"));

    expect(mobileRules).toMatch(
      /\.hero__title\.split-parent\s*{[^}]*white-space:\s*nowrap;/,
    );
    expect(mobileRules).toMatch(
      /\.hero h1\s*{[^}]*white-space:\s*nowrap;/,
    );
  });

  it("splits characters once and marks the middle separator", async () => {
    installMotionPreference(false);
    const { rerender } = render(
      <SplitText
        id="hero-title"
        aria-label="AIGC-CHEN · WELCOME"
        tag="h1"
        text="AIGC-CHEN·WELCOME"
        delay={38}
        duration={0.85}
        from={{ opacity: 0, y: "0.42em" }}
        to={{ opacity: 1, y: 0 }}
      />,
    );

    await waitFor(() => expect(animation.splitCalls).toHaveLength(1));
    expect(screen.getByRole("heading", { name: "AIGC-CHEN · WELCOME" })).toHaveAttribute(
      "id",
      "hero-title",
    );
    const separator = document.querySelector(".split-char--separator");
    expect(separator).toHaveTextContent("·");
    expect(separator.nextElementSibling).not.toHaveProperty("tagName", "WBR");
    expect(document.querySelectorAll("wbr[data-split-break]")).toHaveLength(0);
    expect(animation.fromTo.mock.calls[0][2]).toMatchObject({
      duration: 0.85,
      stagger: 0.038,
      scrollTrigger: { once: true },
    });

    rerender(
      <SplitText
        id="hero-title"
        aria-label="AIGC-CHEN · WELCOME"
        tag="h1"
        text="AIGC-CHEN·WELCOME"
        delay={38}
        duration={0.85}
        from={{ opacity: 0, y: "0.42em" }}
        to={{ opacity: 1, y: 0 }}
      />,
    );
    expect(animation.splitCalls).toHaveLength(1);
    expect(document.querySelectorAll("wbr[data-split-break]")).toHaveLength(0);
  });

  it("renders static text when reduced motion is requested", async () => {
    installMotionPreference(true);
    render(<SplitText tag="h1" text="AIGC-CHEN·WELCOME" />);
    expect(screen.getByRole("heading")).toHaveTextContent("AIGC-CHEN·WELCOME");
    await Promise.resolve();
    expect(animation.splitCalls).toHaveLength(0);
  });

  it("keeps readable static text when splitting fails", async () => {
    installMotionPreference(false);
    animation.throwOnSplit = true;
    render(<SplitText tag="h1" text="AIGC-CHEN·WELCOME" />);
    await waitFor(() =>
      expect(screen.getByRole("heading")).toHaveAttribute("data-split-state", "fallback"),
    );
    expect(screen.getByRole("heading")).toHaveTextContent("AIGC-CHEN·WELCOME");
  });

  it("reverts its own split instance on unmount", async () => {
    installMotionPreference(false);
    const { unmount } = render(<SplitText tag="h1" text="AIGC-CHEN·WELCOME" />);
    await waitFor(() => expect(animation.splitCalls).toHaveLength(1));
    unmount();
    expect(animation.revert).toHaveBeenCalledTimes(1);
  });
});
