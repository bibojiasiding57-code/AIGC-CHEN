import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExperienceVideo from "./ExperienceVideo";

describe("ExperienceVideo", () => {
  let play;

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps a permanent muted inline looping source", () => {
    render(
      <ExperienceVideo
        src="/media/works/test-success.mp4"
        className="experience-media experience-media--video"
        ariaLabel="测试成功动态影像"
      />,
    );

    const video = screen.getByLabelText("测试成功动态影像");
    expect(video).toHaveAttribute("src", "/media/works/test-success.mp4");
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video.muted).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("retries muted playback on canplay and visibility recovery", () => {
    render(
      <ExperienceVideo
        src="/media/works/test-success.mp4"
        ariaLabel="测试成功动态影像"
      />,
    );

    const video = screen.getByLabelText("测试成功动态影像");
    fireEvent.canPlay(video);
    expect(play).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    fireEvent(document, new Event("visibilitychange"));
    expect(play).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    fireEvent(document, new Event("visibilitychange"));
    expect(play).toHaveBeenCalledTimes(3);
  });
});
