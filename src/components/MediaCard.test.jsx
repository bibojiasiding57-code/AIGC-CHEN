import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MediaCard from "./MediaCard";

const project = {
  id: "avatr-ad",
  title: "啊维塔广告",
  category: "AI FILM / AUTOMOTIVE",
  year: "2026",
  type: "video",
  src: "/media/works/avatr-ad.mp4",
  tone: "amber",
};

describe("MediaCard", () => {
  let play;
  let pause;
  let observers;
  let observe;
  let disconnect;

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
    observers = [];
    observe = vi.fn();
    disconnect = vi.fn();
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: false, effectiveType: "4g" },
    });
    globalThis.IntersectionObserver = vi.fn(function IntersectionObserver(callback, options = {}) {
      this.callback = callback;
      this.options = options;
      this.observe = observe;
      this.disconnect = disconnect;
      observers.push(this);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("previews on hover and pauses and rewinds on leave", () => {
    const { container } = render(<MediaCard project={project} />);
    const visual = container.querySelector(".media-card__visual");
    const video = screen.getByLabelText("啊维塔广告 视频预览");

    Object.defineProperty(video, "currentTime", { value: 8, writable: true });
    fireEvent.pointerEnter(visual);
    expect(play).toHaveBeenCalledTimes(1);

    fireEvent.pointerLeave(visual);
    expect(pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
  });

  it("prewarms video near the viewport", () => {
    const { container } = render(<MediaCard project={project} />);
    const video = container.querySelector("video");

    expect(observers).toHaveLength(2);
    expect(observers[0].options).toEqual({ rootMargin: "200px 0px" });
    expect(observe).toHaveBeenCalledWith(container.querySelector(".media-card__visual"));
    expect(video).not.toHaveAttribute("src");
    act(() => observers[0].callback([{ isIntersecting: true }]));

    expect(video).toHaveAttribute("src", project.src);
    expect(video).toHaveAttribute("preload", "metadata");
  });

  it("shows a skeleton until the first frame is available", () => {
    const { container } = render(<MediaCard project={project} />);
    const video = container.querySelector("video");

    expect(screen.getByRole("status", { name: "视频加载中" })).toHaveClass(
      "video-loading--skeleton",
    );
    fireEvent.loadedData(video);
    expect(screen.queryByRole("status", { name: "视频加载中" })).not.toBeInTheDocument();
  });

  it("shows buffering feedback until the preview can play", () => {
    const { container } = render(<MediaCard project={project} />);
    const video = container.querySelector("video");

    fireEvent.waiting(video);
    expect(screen.getByRole("status", { name: "视频缓冲中" })).toBeInTheDocument();

    fireEvent.canPlay(video);
    expect(screen.queryByRole("status", { name: "视频缓冲中" })).not.toBeInTheDocument();
  });

  it("opens the project on visual double click", () => {
    const onOpen = vi.fn();
    const { container } = render(<MediaCard project={project} onOpen={onOpen} />);

    fireEvent.doubleClick(container.querySelector(".media-card__visual"));
    expect(onOpen).toHaveBeenCalledWith(project);
  });

  it("provides a clickable large-view button above the video", () => {
    const onOpen = vi.fn();
    render(<MediaCard project={project} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole("button", { name: "大尺寸播放 啊维塔广告" }));
    expect(onOpen).toHaveBeenCalledWith(project);
  });
});
