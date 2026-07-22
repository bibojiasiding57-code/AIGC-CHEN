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
      <RegisteredVideo id="card-a" group="preview" src="/card-a.mp4" />
      <RegisteredVideo id="card-b" group="preview" src="/card-b.mp4" />
      <RegisteredVideo id="dialog" group="modal" src="/dialog.mp4" />
      <button onClick={() => bandwidth.activatePreview("card-a")}>preview</button>
      <button onClick={() => bandwidth.releasePreview("card-a")}>leave</button>
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

  it("physically disconnects downgraded videos across idle, preview, and modal priority", () => {
    render(
      <VideoBandwidthProvider>
        <Harness />
      </VideoBandwidthProvider>,
    );

    const hero = screen.getByTestId("hero");
    const experience = screen.getByTestId("experience");
    const cardA = screen.getByTestId("card-a");
    const cardB = screen.getByTestId("card-b");
    const dialog = screen.getByTestId("dialog");

    expect(hero).toHaveAttribute("src", "/hero.mp4");
    expect(experience).toHaveAttribute("src", "/experience.mp4");
    expect(cardA).not.toHaveAttribute("src");

    fireEvent.click(screen.getByRole("button", { name: "preview" }));
    expect(cardA).toHaveAttribute("src", "/card-a.mp4");
    expect(hero).not.toHaveAttribute("src");
    expect(experience).not.toHaveAttribute("src");
    expect(cardB).not.toHaveAttribute("src");

    fireEvent.click(screen.getByRole("button", { name: "modal" }));
    expect(dialog).toHaveAttribute("src", "/dialog.mp4");
    expect(cardA).not.toHaveAttribute("src");
    expect(hero).not.toHaveAttribute("src");

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(hero).toHaveAttribute("src", "/hero.mp4");
    expect(experience).toHaveAttribute("src", "/experience.mp4");
    expect(dialog).not.toHaveAttribute("src");

    fireEvent.click(screen.getByRole("button", { name: "preview" }));
    fireEvent.click(screen.getByRole("button", { name: "leave" }));
    expect(hero).toHaveAttribute("src", "/hero.mp4");
    expect(experience).toHaveAttribute("src", "/experience.mp4");
    expect(cardA).not.toHaveAttribute("src");
  });
});
