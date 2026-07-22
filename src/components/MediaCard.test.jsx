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
  poster: "/media/works/posters/avatr-ad.webp",
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

  it("tracks a nearby card without prewarming its video", () => {
    const { container } = render(<MediaCard project={project} />);
    const video = container.querySelector("video");

    expect(observers).toHaveLength(2);
    expect(observers[0].options).toEqual({ rootMargin: "200px 0px" });
    expect(observe).toHaveBeenCalledWith(container.querySelector(".media-card__visual"));
    expect(video).not.toHaveAttribute("src");
    act(() => observers[0].callback([{ isIntersecting: true }]));

    expect(video).not.toHaveAttribute("src");
    expect(video).toHaveAttribute("preload", "metadata");
  });

  it("keeps its poster visible until a playable frame exists", () => {
    const { container } = render(<MediaCard project={project} />);
    const visual = container.querySelector(".media-card__visual");
    const video = container.querySelector("video");
    const poster = container.querySelector(".media-card__poster");

    expect(video).not.toHaveAttribute("src");
    expect(poster).toHaveAttribute("src", project.poster);
    expect(poster).toHaveAttribute("data-visible", "true");

    fireEvent.pointerEnter(visual);
    expect(video).toHaveAttribute("src", project.src);
    fireEvent.canPlay(video);
    expect(poster).toHaveAttribute("data-visible", "false");

    fireEvent.waiting(video);
    expect(poster).toHaveAttribute("data-visible", "true");
  });

  it("shows Loading only after playback intent and hides it on the first frame", () => {
    const { container } = render(<MediaCard project={project} />);
    const video = container.querySelector("video");
    const visual = container.querySelector(".media-card__visual");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.pointerEnter(visual);
    expect(screen.getByRole("status")).toBeInTheDocument();
    fireEvent.loadedData(video);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows buffering feedback until the preview can play", () => {
    const { container } = render(<MediaCard project={project} />);
    const video = container.querySelector("video");

    fireEvent.pointerEnter(container.querySelector(".media-card__visual"));
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
