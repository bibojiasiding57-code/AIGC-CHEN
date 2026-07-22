import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import {
  VideoBandwidthProvider,
  useVideoBandwidthController,
  useVideoBandwidthRegistration,
} from "./VideoBandwidthContext";

function RegisteredVideo({ id, group, src }) {
  const ref = useRef(null);
  useVideoBandwidthRegistration({ id, group, src, mediaRef: ref });
  return <video ref={ref} data-testid={id} />;
}

function Harness() {
  const bandwidth = useVideoBandwidthController();
  return (
    <>
      <RegisteredVideo id="hero" group="idle" src="/hero.mp4" />
      <RegisteredVideo id="experience" group="idle" src="/experience.mp4" />
      <RegisteredVideo id="dialog" group="modal" src="/dialog.mp4" />
      <button onClick={() => bandwidth.activateModal("dialog")}>modal</button>
      <button onClick={() => bandwidth.releaseModal("dialog")}>close</button>
    </>
  );
}

describe("VideoBandwidthProvider", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("pauses idle videos without clearing their sources while the modal owns bandwidth", () => {
    render(
      <VideoBandwidthProvider>
        <Harness />
      </VideoBandwidthProvider>,
    );

    const hero = screen.getByTestId("hero");
    const experience = screen.getByTestId("experience");
    const dialog = screen.getByTestId("dialog");

    expect(hero).toHaveAttribute("src", "/hero.mp4");
    expect(experience).toHaveAttribute("src", "/experience.mp4");
    expect(dialog).not.toHaveAttribute("src");

    fireEvent.click(screen.getByRole("button", { name: "modal" }));
    expect(dialog).toHaveAttribute("src", "/dialog.mp4");
    expect(hero).toHaveAttribute("src", "/hero.mp4");
    expect(experience).toHaveAttribute("src", "/experience.mp4");
    expect(hero.pause).toHaveBeenCalled();
    expect(experience.pause).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(hero).toHaveAttribute("src", "/hero.mp4");
    expect(experience).toHaveAttribute("src", "/experience.mp4");
    expect(dialog).not.toHaveAttribute("src");
    expect(hero.play).toHaveBeenCalled();
    expect(experience.play).toHaveBeenCalled();
  });
});
