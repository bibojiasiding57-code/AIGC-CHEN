import { fireEvent, render, screen } from "@testing-library/react";
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

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
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
