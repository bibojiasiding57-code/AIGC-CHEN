import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MediaCard from "./MediaCard";
import { VideoBandwidthProvider } from "../video/VideoBandwidthContext";

const project = {
  id: "avatr-ad",
  title: "Avatr Ad",
  category: "AI FILM / AUTOMOTIVE",
  year: "2026",
  type: "video",
  src: "/videos/avatr-ad.mp4",
  poster: "/media/works/posters/avatr-ad.webp",
  tone: "amber",
};

const secondProject = {
  ...project,
  id: "pv",
  title: "PV",
  src: "/videos/pv.mp4",
  poster: "/media/works/posters/pv.webp",
};

function renderCards(children) {
  return render(<VideoBandwidthProvider>{children}</VideoBandwidthProvider>);
}

describe("MediaCard bandwidth ownership", () => {
  let play;
  let pause;
  let load;

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders a poster-only video container without mounting a work video source", () => {
    const { container } = renderCards(<MediaCard project={project} />);
    const visual = container.querySelector(".media-card__visual");
    const posterVideo = container.querySelector("video.media-card__poster");

    expect(visual).toHaveAttribute("data-video-src", project.src);
    expect(posterVideo).toHaveAttribute("poster", project.poster);
    expect(posterVideo).toHaveAttribute("preload", "none");
    expect(posterVideo).not.toHaveAttribute("src");
    fireEvent.pointerEnter(visual);
    expect(play).not.toHaveBeenCalled();
  });

  it("uses the poster while disconnected and removes custom loading overlays", () => {
    const { container } = renderCards(<MediaCard project={project} />);
    const poster = container.querySelector("video.media-card__poster");

    expect(poster).toHaveAttribute("poster", project.poster);
    expect(container.querySelector(".video-loading")).not.toBeInTheDocument();
  });

  it("opens the project from double click and the play button", () => {
    const onOpen = vi.fn();
    const { container } = renderCards(<MediaCard project={project} onOpen={onOpen} />);

    fireEvent.doubleClick(container.querySelector(".media-card__visual"));
    expect(onOpen).toHaveBeenCalledWith(project);
    fireEvent.click(container.querySelector(".media-card__play"));
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});
