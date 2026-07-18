import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RevealMedia from "./RevealMedia";

describe("RevealMedia", () => {
  it("wraps image and video media with one dimmer each", () => {
    const { container } = render(
      <>
        <RevealMedia src="/image.jpg" alt="Image reveal" className="image-layout" />
        <RevealMedia
          as="video"
          src="/video.mp4"
          aria-label="Video reveal"
          className="video-layout"
          muted
        />
      </>,
    );

    expect(screen.getAllByTestId("reveal-media")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Image reveal" })).toBeVisible();
    expect(container.querySelectorAll("video")).toHaveLength(1);
    expect(container.querySelectorAll(".reveal-media__dimmer")).toHaveLength(2);
  });
});
