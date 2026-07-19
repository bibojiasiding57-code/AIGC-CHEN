import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorksVideoDialog from "./WorksVideoDialog";

const project = {
  id: "avatr-ad",
  title: "啊维塔广告",
  category: "AI FILM / AUTOMOTIVE",
  year: "2026",
  type: "video",
  src: "/media/works/avatr-ad.mp4",
  tone: "amber",
};

describe("WorksVideoDialog", () => {
  let play;
  let pause;

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close() {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the selected project in a large controlled player", () => {
    render(<WorksVideoDialog project={project} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "啊维塔广告 大尺寸播放器" });
    const video = screen.getByLabelText("啊维塔广告 大尺寸视频");
    expect(dialog).toHaveAttribute("open");
    expect(video).toHaveAttribute("src", project.src);
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("preload", "auto");
    expect(play).toHaveBeenCalled();
  });

  it("shows buffering feedback until playback resumes", () => {
    render(<WorksVideoDialog project={project} onClose={vi.fn()} />);
    const video = screen.getByLabelText(`${project.title} 大尺寸视频`);

    fireEvent.waiting(video);
    expect(screen.getByRole("status", { name: "视频缓冲中" })).toBeInTheDocument();

    fireEvent.playing(video);
    expect(screen.queryByRole("status", { name: "视频缓冲中" })).not.toBeInTheDocument();
  });

  it("pauses and resets before closing", () => {
    const onClose = vi.fn();
    render(<WorksVideoDialog project={project} onClose={onClose} />);
    const video = screen.getByLabelText("啊维塔广告 大尺寸视频");
    Object.defineProperty(video, "currentTime", { value: 12, writable: true });

    fireEvent.click(screen.getByRole("button", { name: "关闭大尺寸播放器" }));
    expect(pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the dialog backdrop itself is clicked", () => {
    const onClose = vi.fn();
    render(<WorksVideoDialog project={project} onClose={onClose} />);

    fireEvent.click(screen.getByRole("dialog", { name: "啊维塔广告 大尺寸播放器" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
