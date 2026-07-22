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
  poster: "/media/works/posters/avatr-ad.webp",
  tone: "amber",
};

describe("WorksVideoDialog", () => {
  let play;
  let pause;
  let load;

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
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
    const pausePreviews = vi.fn();
    window.addEventListener("aigcchen:modal-video-open", pausePreviews, { once: true });
    render(<WorksVideoDialog project={project} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "啊维塔广告 大尺寸播放器" });
    const video = screen.getByLabelText("啊维塔广告 大尺寸视频");
    expect(dialog).toHaveAttribute("open");
    expect(video).toHaveAttribute("src", project.src);
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("preload", "auto");
    expect(video).toHaveAttribute("playsinline");
    expect(play).toHaveBeenCalled();
    expect(pausePreviews).toHaveBeenCalledTimes(1);
  });

  it("keeps the modal poster visible before readiness and while buffering", () => {
    const { container } = render(<WorksVideoDialog project={project} onClose={vi.fn()} />);
    const video = screen.getByLabelText(`${project.title} 大尺寸视频`);
    const poster = container.querySelector(".works-dialog__poster");

    expect(poster).toHaveAttribute("src", project.poster);
    expect(poster).toHaveAttribute("data-visible", "true");
    fireEvent.canPlay(video);
    expect(poster).toHaveAttribute("data-visible", "false");
    fireEvent.waiting(video);
    expect(poster).toHaveAttribute("data-visible", "true");
  });

  it("shows a skeleton until the first modal frame is available", () => {
    render(<WorksVideoDialog project={project} onClose={vi.fn()} />);
    const video = screen.getByLabelText(`${project.title} 大尺寸视频`);

    expect(screen.getByRole("status", { name: "视频加载中" })).toHaveClass(
      "video-loading--skeleton",
    );
    fireEvent.loadedData(video);
    expect(screen.queryByRole("status", { name: "视频加载中" })).not.toBeInTheDocument();
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
    expect(video).not.toHaveAttribute("src");
    expect(load).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the dialog backdrop itself is clicked", () => {
    const onClose = vi.fn();
    render(<WorksVideoDialog project={project} onClose={onClose} />);

    fireEvent.click(screen.getByRole("dialog", { name: "啊维塔广告 大尺寸播放器" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
