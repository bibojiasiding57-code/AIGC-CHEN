import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorksVideoDialog from "./WorksVideoDialog";
import ExperienceVideo from "./ExperienceVideo";
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

describe("WorksVideoDialog", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close() {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    });
  });

  afterEach(() => vi.restoreAllMocks());

  function renderDialog(onClose = vi.fn()) {
    return render(
      <VideoBandwidthProvider>
        <ExperienceVideo id="experience" src="/experience.mp4" ariaLabel="Experience" />
        <WorksVideoDialog project={project} onClose={onClose} />
      </VideoBandwidthProvider>,
    );
  }

  it("gives the modal exclusive source ownership and native controls", () => {
    const { container } = renderDialog();
    const experience = screen.getByLabelText("Experience");
    const modal = container.querySelector(".works-dialog__video");

    expect(modal).toHaveAttribute("src", project.src);
    expect(modal).toHaveAttribute("controls");
    expect(modal).toHaveAttribute("preload", "auto");
    expect(experience).not.toHaveAttribute("src");
    expect(container.querySelector(".video-loading")).not.toBeInTheDocument();
  });

  it("restores idle video ownership after close", () => {
    const onClose = vi.fn();
    const { container } = renderDialog(onClose);
    const experience = screen.getByLabelText("Experience");

    fireEvent.click(container.querySelector(".works-dialog__header button"));
    expect(container.querySelector(".works-dialog__video")).not.toHaveAttribute("src");
    expect(experience).toHaveAttribute("src", "/experience.mp4");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
