import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const gsapMock = vi.hoisted(() => {
  const timeline = {
    to: vi.fn(),
    kill: vi.fn(),
    pause: vi.fn(),
    restart: vi.fn(),
  };
  timeline.to.mockReturnValue(timeline);
  return {
    set: vi.fn(),
    to: vi.fn(() => ({ kill: vi.fn() })),
    killTweensOf: vi.fn(),
    getProperty: vi.fn(() => 0),
    timeline: vi.fn(() => timeline),
    ticker: { add: vi.fn(), remove: vi.fn() },
    timelineInstance: timeline,
  };
});

vi.mock("gsap", () => ({ gsap: gsapMock }));

import TargetCursor from "./TargetCursor";

const renderScopedCursor = (props = {}) => {
  const scopeRef = createRef();
  const result = render(
    <section ref={scopeRef} data-testid="scope">
      <button className="cursor-target">Target</button>
      <TargetCursor scopeRef={scopeRef} {...props} />
    </section>,
  );
  return { ...result, scope: screen.getByTestId("scope") };
};

describe("TargetCursor", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 0 });
    window.matchMedia = vi.fn(query => ({
      matches: query === "(prefers-reduced-motion: reduce)" ? false : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    document.body.style.cursor = "crosshair";
    gsapMock.ticker.add.mockClear();
    gsapMock.ticker.remove.mockClear();
    gsapMock.timelineInstance.kill.mockClear();
  });

  afterEach(() => {
    document.body.style.cursor = "";
  });

  it("activates only while the pointer is inside its scope", () => {
    const { scope } = renderScopedCursor();
    const cursor = screen.getByTestId("target-cursor");

    expect(cursor).toHaveAttribute("aria-hidden", "true");
    expect(cursor).not.toHaveClass("is-visible");
    expect(document.body.style.cursor).toBe("crosshair");

    fireEvent.mouseEnter(scope);
    expect(cursor).toHaveClass("is-visible");
    expect(document.body.style.cursor).toBe("none");

    fireEvent.mouseLeave(scope);
    expect(cursor).not.toHaveClass("is-visible");
    expect(document.body.style.cursor).toBe("crosshair");
  });

  it("locks onto targets using the default selector and releases them", () => {
    const { scope } = renderScopedCursor({ cursorColorOnTarget: "#dff7ff" });
    const target = screen.getByRole("button", { name: "Target" });

    fireEvent.mouseEnter(scope);
    fireEvent.mouseOver(target);
    expect(screen.getByTestId("target-cursor")).toHaveClass("is-targeting");
    expect(gsapMock.ticker.add).toHaveBeenCalledTimes(1);

    fireEvent.mouseOut(target, { relatedTarget: scope });
    expect(screen.getByTestId("target-cursor")).not.toHaveClass("is-targeting");
    expect(gsapMock.ticker.remove).toHaveBeenCalled();
  });

  it("restores global state and kills animation work on unmount", () => {
    const { scope, unmount } = renderScopedCursor();
    fireEvent.mouseEnter(scope);
    fireEvent.mouseOver(screen.getByRole("button", { name: "Target" }));

    unmount();

    expect(document.body.style.cursor).toBe("crosshair");
    expect(gsapMock.ticker.remove).toHaveBeenCalled();
    expect(gsapMock.timelineInstance.kill).toHaveBeenCalled();
  });

  it("scopes movement, press, hover, and scroll work to scopeRef", () => {
    const { scope } = renderScopedCursor();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    const target = screen.getByRole("button", { name: "Target" });

    gsapMock.to.mockClear();
    fireEvent.mouseMove(window, { clientX: 10, clientY: 20 });
    fireEvent.mouseDown(window);
    fireEvent.mouseOver(outside);
    fireEvent.scroll(window);
    expect(gsapMock.to).not.toHaveBeenCalled();

    fireEvent.mouseEnter(scope);
    fireEvent.mouseMove(scope, { clientX: 30, clientY: 40 });
    fireEvent.mouseDown(scope);
    fireEvent.mouseUp(scope);
    fireEvent.mouseOver(target);
    fireEvent.scroll(scope);
    expect(gsapMock.to).toHaveBeenCalled();
    expect(gsapMock.ticker.add).toHaveBeenCalledTimes(1);

    outside.remove();
  });

  it("uses the React Bits palette by default", () => {
    renderScopedCursor();
    expect(screen.getByTestId("target-cursor")).toHaveStyle({
      "--cursor-color": "#A855F7",
      "--cursor-target-color": "#9779b3",
    });
  });

  it("does not render for reduced motion or touch-first devices", () => {
    window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const scopeRef = createRef();
    const { rerender } = render(<TargetCursor scopeRef={scopeRef} />);
    expect(screen.queryByTestId("target-cursor")).not.toBeInTheDocument();

    window.matchMedia = vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 2 });
    rerender(<TargetCursor scopeRef={scopeRef} spinDuration={3} />);
    expect(screen.queryByTestId("target-cursor")).not.toBeInTheDocument();
  });
});
