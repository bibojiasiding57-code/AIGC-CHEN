import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const threeState = vi.hoisted(() => ({
  renderers: [],
  throwOnConstruct: false,
}));

vi.mock("three", () => {
  class WebGLRenderer {
    constructor() {
      if (threeState.throwOnConstruct) {
        throw new Error("WebGL unavailable");
      }

      this.domElement = document.createElement("canvas");
      this.shadowMap = { enabled: true };
      this.setPixelRatio = vi.fn();
      this.setClearColor = vi.fn();
      this.setSize = vi.fn();
      this.render = vi.fn();
      this.dispose = vi.fn();
      this.forceContextLoss = vi.fn();
      threeState.renderers.push(this);
    }
  }

  class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }

    lerp(target, alpha) {
      this.x += (target.x - this.x) * alpha;
      this.y += (target.y - this.y) * alpha;
      return this;
    }
  }

  class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    set(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
  }

  class Vector4 extends Vector3 {
    constructor(x = 0, y = 0, z = 0, w = 0) {
      super(x, y, z);
      this.w = w;
    }

    set(x, y, z, w) {
      super.set(x, y, z);
      this.w = w;
      return this;
    }
  }

  return {
    AdditiveBlending: "AdditiveBlending",
    SRGBColorSpace: "SRGBColorSpace",
    WebGLRenderer,
    Scene: class Scene {
      add() {}
    },
    OrthographicCamera: class OrthographicCamera {},
    BufferGeometry: class BufferGeometry {
      setAttribute() {}
      dispose() {}
    },
    BufferAttribute: class BufferAttribute {},
    RawShaderMaterial: class RawShaderMaterial {
      dispose() {}
    },
    Mesh: class Mesh {},
    Clock: class Clock {
      elapsed = 0;

      getElapsedTime() {
        this.elapsed += 0.016;
        return this.elapsed;
      }
    },
    Vector2,
    Vector3,
    Vector4,
  };
});

import LaserFlow from "./LaserFlow";

let animationFrames;
let nextAnimationFrame;

const setDocumentHidden = hidden => {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden,
  });
};

const flushAnimationFrame = () => {
  const callbacks = [...animationFrames.values()];
  animationFrames.clear();
  callbacks.forEach(callback => callback(performance.now()));
};

beforeEach(() => {
  threeState.renderers.length = 0;
  threeState.throwOnConstruct = false;
  setDocumentHidden(false);

  animationFrames = new Map();
  nextAnimationFrame = 1;
  vi.stubGlobal("requestAnimationFrame", vi.fn(callback => {
    const id = nextAnimationFrame;
    nextAnimationFrame += 1;
    animationFrames.set(id, callback);
    return id;
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn(id => {
    animationFrames.delete(id);
  }));
  vi.stubGlobal("ResizeObserver", class ResizeObserver {
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal("IntersectionObserver", class IntersectionObserver {
    observe() {}
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setDocumentHidden(false);
});

describe("LaserFlow", () => {
  it("falls back without breaking the page when WebGL cannot initialize", async () => {
    threeState.throwOnConstruct = true;
    render(<LaserFlow />);
    const flow = screen.getByTestId("laser-flow");
    await waitFor(() => expect(flow).toHaveAttribute("data-laser-state", "fallback"));
  });

  it("reinitializes the renderer when mouseSmoothTime changes", () => {
    const { rerender } = render(<LaserFlow mouseSmoothTime={0.08} />);
    const firstRenderer = threeState.renderers[0];

    rerender(<LaserFlow mouseSmoothTime={0.2} />);

    expect(threeState.renderers).toHaveLength(2);
    expect(firstRenderer.dispose).toHaveBeenCalledOnce();
    expect(firstRenderer.forceContextLoss).toHaveBeenCalledOnce();
  });

  it("stays paused after becoming visible while the WebGL context is lost", () => {
    render(<LaserFlow />);
    const renderer = threeState.renderers[0];
    renderer.render.mockClear();

    renderer.domElement.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    document.dispatchEvent(new Event("visibilitychange"));
    flushAnimationFrame();

    expect(renderer.render).not.toHaveBeenCalled();
  });

  it("stays paused after context restoration while the document is hidden", () => {
    render(<LaserFlow />);
    const renderer = threeState.renderers[0];
    renderer.render.mockClear();

    setDocumentHidden(true);
    document.dispatchEvent(new Event("visibilitychange"));
    renderer.domElement.dispatchEvent(new Event("webglcontextrestored"));
    flushAnimationFrame();

    expect(renderer.render).not.toHaveBeenCalled();
  });
});
