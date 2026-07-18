import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ClickSpark from "./ClickSpark";

let frameCallbacks;
let resizeObservers;
let context;

beforeEach(() => {
  frameCallbacks = new Map();
  resizeObservers = [];
  context = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: "",
    lineWidth: 0,
  };

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
  vi.stubGlobal("requestAnimationFrame", vi.fn(callback => {
    const id = frameCallbacks.size + 1;
    frameCallbacks.set(id, callback);
    return id;
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn(id => frameCallbacks.delete(id)));
  vi.stubGlobal("ResizeObserver", class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnect = vi.fn();
      resizeObservers.push(this);
    }

    observe() {}
  });
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ClickSpark", () => {
  it("renders children with a fixed, non-interactive full-screen canvas", () => {
    const { container } = render(<ClickSpark><button>Action</button></ClickSpark>);

    expect(screen.getByRole("button", { name: "Action" })).toBeVisible();
    expect(container.querySelector("canvas")).toHaveClass("click-spark__canvas");
  });

  it("listens globally, starts animation only after a click, and uses prop color", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { container } = render(<ClickSpark sparkColor="#7cf" sparkCount={4} />);
    const canvas = container.querySelector("canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600,
    });

    expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function));
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    fireEvent.click(document.body, { clientX: 100, clientY: 80 });
    expect(requestAnimationFrame).toHaveBeenCalledOnce();

    const draw = [...frameCallbacks.values()][0];
    frameCallbacks.clear();
    draw(performance.now() + 16);
    expect(context.stroke).toHaveBeenCalledTimes(4);
    expect(context.strokeStyle).toBe("#7cf");
  });

  it("removes global and resize resources and cancels an active frame", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<ClickSpark />);
    fireEvent.click(window, { clientX: 10, clientY: 10 });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function));
    expect(resizeObservers[0].disconnect).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("does not animate when reduced motion or coarse touch input is preferred", () => {
    matchMedia.mockImplementation(query => ({
      matches: query.includes("prefers-reduced-motion") || query.includes("pointer: coarse"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<ClickSpark />);
    fireEvent.click(window, { clientX: 10, clientY: 10 });

    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
