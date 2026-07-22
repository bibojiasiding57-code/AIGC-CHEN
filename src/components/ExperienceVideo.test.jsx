import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExperienceVideo from "./ExperienceVideo";
import {
  VideoBandwidthProvider,
  useVideoBandwidthController,
} from "../video/VideoBandwidthContext";

function PreviewControls() {
  const bandwidth = useVideoBandwidthController();
  return (
    <>
      <button onClick={() => bandwidth.activatePreview("card")}>preview</button>
      <button onClick={() => bandwidth.releasePreview("card")}>leave</button>
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

  it("loops in idle, disconnects during preview, and restores after preview release", () => {
    render(
      <VideoBandwidthProvider>
        <ExperienceVideo id="experience" src="/media/works/test-success.mp4" ariaLabel="Experience" />
        <PreviewControls />
      </VideoBandwidthProvider>,
    );

    const video = screen.getByLabelText("Experience");
    expect(video).toHaveAttribute("src", "/media/works/test-success.mp4");
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");

    fireEvent.click(screen.getByRole("button", { name: "preview" }));
    expect(video).not.toHaveAttribute("src");
    fireEvent.click(screen.getByRole("button", { name: "leave" }));
    expect(video).toHaveAttribute("src", "/media/works/test-success.mp4");
  });
});
