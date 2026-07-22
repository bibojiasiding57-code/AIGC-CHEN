import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExperienceVideo from "./ExperienceVideo";
import {
  VideoBandwidthProvider,
  useVideoBandwidthController,
} from "../video/VideoBandwidthContext";

function ModalControls() {
  const bandwidth = useVideoBandwidthController();
  return (
    <>
      <button onClick={() => bandwidth.activateModal("dialog")}>open</button>
      <button onClick={() => bandwidth.releaseModal("dialog")}>close</button>
    </>
  );
}

describe("ExperienceVideo", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  afterEach(() => vi.restoreAllMocks());

  it("loops in idle, pauses without source destruction for a modal, and resumes after close", () => {
    render(
      <VideoBandwidthProvider>
        <ExperienceVideo id="experience" src="/videos/test-success.mp4" ariaLabel="Experience" />
        <ModalControls />
      </VideoBandwidthProvider>,
    );

    const video = screen.getByLabelText("Experience");
    expect(video).toHaveAttribute("src", "/videos/test-success.mp4");
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");

    fireEvent.click(screen.getByRole("button", { name: "open" }));
    expect(video).toHaveAttribute("src", "/videos/test-success.mp4");
    expect(video.pause).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(video).toHaveAttribute("src", "/videos/test-success.mp4");
    expect(video.play).toHaveBeenCalled();
  });
});
