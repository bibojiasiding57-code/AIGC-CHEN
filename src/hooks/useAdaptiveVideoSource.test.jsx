import { act, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useAdaptiveVideoSource from "./useAdaptiveVideoSource";

const SOURCE = "/media/works/avatr-ad.mp4";

function Probe() {
  const mediaRef = useRef(null);
  const state = useAdaptiveVideoSource({ source: SOURCE, mediaRef, releaseDelay: 20_000 });

  return (
    <div ref={state.containerRef} data-testid="container">
      <video ref={mediaRef} src={state.activeSource} data-testid="video" />
      <output data-testid="near">{String(state.isNearViewport)}</output>
      <output data-testid="active">{String(state.isInViewport)}</output>
      <button type="button" onClick={state.requestSource}>request</button>
    </div>
  );
}

describe("useAdaptiveVideoSource", () => {
  let observers;
  let pause;
  let load;

  beforeEach(() => {
    observers = [];
    pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: false, effectiveType: "4g" },
    });
    globalThis.IntersectionObserver = vi.fn(function MockObserver(callback, options = {}) {
      this.callback = callback;
      this.options = options;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      observers.push(this);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("prewarms the source 200px before the card enters the viewport", () => {
    const { getByTestId } = render(<Probe />);
    expect(observers).toHaveLength(2);
    expect(observers[0].options).toEqual({ rootMargin: "200px 0px" });
    expect(getByTestId("video")).not.toHaveAttribute("src");

    act(() => observers[0].callback([{ isIntersecting: true }]));

    expect(getByTestId("video")).toHaveAttribute("src", SOURCE);
    expect(getByTestId("near")).toHaveTextContent("true");
    expect(load).toHaveBeenCalled();
  });

  it("pauses on viewport exit and releases the source after 20 seconds away", () => {
    vi.useFakeTimers();
    const { getByTestId } = render(<Probe />);
    act(() => observers[0].callback([{ isIntersecting: true }]));
    act(() => observers[1].callback([{ isIntersecting: true }]));
    act(() => observers[1].callback([{ isIntersecting: false }]));
    expect(pause).toHaveBeenCalled();

    act(() => observers[0].callback([{ isIntersecting: false }]));
    act(() => vi.advanceTimersByTime(19_999));
    expect(getByTestId("video")).toHaveAttribute("src", SOURCE);
    act(() => vi.advanceTimersByTime(1));
    expect(getByTestId("video")).not.toHaveAttribute("src");
  });

  it("cancels delayed release when the card returns", () => {
    vi.useFakeTimers();
    const { getByTestId } = render(<Probe />);
    act(() => observers[0].callback([{ isIntersecting: true }]));
    act(() => observers[0].callback([{ isIntersecting: false }]));
    act(() => vi.advanceTimersByTime(10_000));
    act(() => observers[0].callback([{ isIntersecting: true }]));
    act(() => vi.advanceTimersByTime(20_000));
    expect(getByTestId("video")).toHaveAttribute("src", SOURCE);
  });

  it("skips automatic prewarming on Save-Data but loads on user request", () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true, effectiveType: "4g" },
    });
    const { getByRole, getByTestId } = render(<Probe />);
    act(() => observers[0].callback([{ isIntersecting: true }]));
    expect(getByTestId("video")).not.toHaveAttribute("src");

    fireEvent.click(getByRole("button", { name: "request" }));
    expect(getByTestId("video")).toHaveAttribute("src", SOURCE);
  });
});
