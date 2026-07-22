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
  src: "/media/works/avatr-ad.mp4",
  poster: "/media/works/posters/avatr-ad.webp",
  tone: "amber",
};

const secondProject = {
  ...project,
  id: "pv",
  title: "PV",
  src: "/media/works/pv.mp4",
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

  it("keeps the video physically disconnected until hover intent", () => {
    const { container } = renderCards(<MediaCard project={project} />);
    const visual = container.querySelector(".media-card__visual");
    const video = container.querySelector("video");

    expect(video).not.toHaveAttribute("src");
    fireEvent.pointerEnter(visual);
    expect(video).toHaveAttribute("src", project.src);
    expect(play).toHaveBeenCalled();

    fireEvent.pointerLeave(visual);
    expect(video).not.toHaveAttribute("src");
    expect(pause).toHaveBeenCalled();
    expect(load).toHaveBeenCalled();
  });

  it("allows only the most recently hovered card to retain a source", () => {
    const { container } = renderCards(
      <>
        <MediaCard project={project} />
        <MediaCard project={secondProject} />
      </>,
    );
    const visuals = container.querySelectorAll(".media-card__visual");
    const videos = container.querySelectorAll("video");

    fireEvent.pointerEnter(visuals[0]);
    expect(videos[0]).toHaveAttribute("src", project.src);
    fireEvent.pointerEnter(visuals[1]);
    expect(videos[0]).not.toHaveAttribute("src");
    expect(videos[1]).toHaveAttribute("src", secondProject.src);
  });

  it("uses the poster while disconnected and removes custom loading overlays", () => {
    const { container } = renderCards(<MediaCard project={project} />);
    const poster = container.querySelector(".media-card__poster");

    expect(poster).toHaveAttribute("src", project.poster);
    expect(poster).toHaveAttribute("data-visible", "true");
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
