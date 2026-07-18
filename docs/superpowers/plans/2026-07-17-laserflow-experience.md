# LaserFlow Interactive Experience and Hero SplitText Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AIGC-CHEN 的“互动体验”区域加入暖橙金色 LaserFlow 与局部媒体明度揭示，并为首屏 `AIGC-CHEN·WELCOME` 加入只播放一次的逐字入场动效。

**Architecture:** 使用延迟加载的 React Bits `LaserFlow` 作为桌面端 WebGL 背景；三张现有媒体各自包入 `RevealMedia`，通过单层深色遮罩的径向 mask 揭示原媒体，不复制视频。`App` 以 `requestAnimationFrame` 节流指针坐标，`useLaserFlowEnabled` 负责桌面尺寸与减少动态效果的加载门控；独立的 `SplitText` 组件负责首屏标题的 GSAP 字符拆分、单次播放、清理与静态降级。

**Tech Stack:** React 19、Vite 6、Vitest、Testing Library、Three.js、GSAP、`@gsap/react`、CSS mask、WebGL。

## Global Constraints

- 效果只修改 `#experience` 互动体验区。
- SplitText 只修改首屏 `h1#hero-title`，标题文案保持 `AIGC-CHEN·WELCOME`，可访问名称保持 `AIGC-CHEN · WELCOME`。
- PC 端完整 LaserFlow；宽度不大于 `720px` 或 `prefers-reduced-motion` 时不加载 WebGL。
- LaserFlow 使用 `#F6A04D`，媒体遮罩约 55%，完全揭示半径 `120px`，柔边总半径 `240px`，退出过渡 `220ms`。
- SplitText 使用 `delay={38}`、`duration={0.85}`、`ease="power3.out"`、`from={{ opacity: 0, y: "0.42em" }}`、`to={{ opacity: 1, y: 0 }}`，首次进入或刷新只播放一次。
- `prefers-reduced-motion: reduce`、缺少 `matchMedia` 或 GSAP 初始化失败时，首屏标题立即完整静态显示。
- 保留现有两张图片、一段视频、三种情绪模式、标题与按钮；视频始终只有一个互动体验实例。
- 只执行一次 `pnpm add three gsap @gsap/react`；不搜索 pnpm 依赖，不循环联网校验。安装失败即停止并报告。
- 不初始化 Git。当前 `.git` 不是有效仓库，因此本计划不执行提交；每个任务记录建议提交信息供未来使用。
- 所有文件修改使用 `apply_patch`。

## File Map

- Create `src/hooks/useLaserFlowEnabled.js`: 决定是否加载桌面 WebGL 效果。
- Create `src/hooks/useLaserFlowEnabled.test.js`: 验证桌面、手机与减少动态效果门控。
- Create `src/components/RevealMedia.jsx`: 单个媒体、遮罩与布局类的稳定边界。
- Create `src/components/RevealMedia.test.jsx`: 验证图片、视频和遮罩结构。
- Create `src/components/LaserFlow.jsx`: React Bits shader、Three.js 生命周期、指针同步与 WebGL 降级。
- Create `src/components/LaserFlow.css`: LaserFlow 容器样式。
- Create `src/components/LaserFlow.test.jsx`: 验证 WebGL 初始化失败时的无损降级。
- Create `src/components/SplitText.jsx`: 首屏字符拆分、动画生命周期、单次播放与静态降级。
- Create `src/components/SplitText.test.jsx`: 验证正常拆分、圆点类、减少动态效果、失败降级与清理。
- Modify `src/App.jsx`: 延迟加载 LaserFlow、改造媒体结构、管理揭示坐标，并用 SplitText 渲染首屏标题。
- Modify `src/App.test.jsx`: 验证局部坐标、清理状态、WebGL 门控、单视频实例与首屏标题语义。
- Modify `src/styles.css`: 新的层级、媒体定位、径向遮罩、SplitText 标题间距与响应式样式。
- Modify `package.json`: 增加 `three`、`gsap`、`@gsap/react`。
- Modify `pnpm-lock.yaml`: 由一次性依赖安装更新。

---

### Task 1: Responsive LaserFlow loading gate

**Files:**
- Create: `src/hooks/useLaserFlowEnabled.js`
- Create: `src/hooks/useLaserFlowEnabled.test.js`

**Interfaces:**
- Produces: `useLaserFlowEnabled(): boolean`
- Consumes: `window.matchMedia`

- [ ] **Step 1: Write the failing hook tests**

```js
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useLaserFlowEnabled from "./useLaserFlowEnabled";

function installMatchMedia({ desktop, motion }) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query) => ({
      matches: query.includes("min-width") ? desktop : motion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useLaserFlowEnabled", () => {
  it("enables LaserFlow only on desktop with full motion", () => {
    installMatchMedia({ desktop: true, motion: true });
    const { result } = renderHook(() => useLaserFlowEnabled());
    expect(result.current).toBe(true);
  });

  it.each([
    { desktop: false, motion: true },
    { desktop: true, motion: false },
  ])("keeps LaserFlow disabled for $desktop/$motion", (matches) => {
    installMatchMedia(matches);
    const { result } = renderHook(() => useLaserFlowEnabled());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/hooks/useLaserFlowEnabled.test.js
```

Expected: FAIL because `src/hooks/useLaserFlowEnabled.js` does not exist.

- [ ] **Step 3: Implement the hook**

```js
import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 721px)";
const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

export default function useLaserFlowEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const motion = window.matchMedia(MOTION_QUERY);
    const update = () => setEnabled(desktop.matches && motion.matches);

    update();
    desktop.addEventListener?.("change", update);
    motion.addEventListener?.("change", update);

    return () => {
      desktop.removeEventListener?.("change", update);
      motion.removeEventListener?.("change", update);
    };
  }, []);

  return enabled;
}
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run the Step 2 command.

Expected: 1 test file and 3 cases pass.

Suggested future commit: `feat: add responsive laser flow gate`

---

### Task 2: RevealMedia structural boundary

**Files:**
- Create: `src/components/RevealMedia.jsx`
- Create: `src/components/RevealMedia.test.jsx`

**Interfaces:**
- Produces: `RevealMedia({ as, className, mediaClassName, ...mediaProps })`
- Produces DOM contract: `[data-reveal-media]`, `.reveal-media__asset`, `.reveal-media__dimmer`

- [ ] **Step 1: Write the failing component test**

```jsx
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
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/components/RevealMedia.test.jsx
```

Expected: FAIL because `RevealMedia.jsx` does not exist.

- [ ] **Step 3: Implement RevealMedia**

```jsx
export default function RevealMedia({
  as: Tag = "img",
  className = "",
  mediaClassName = "",
  ...mediaProps
}) {
  const wrapperClassName = ["reveal-media", className].filter(Boolean).join(" ");
  const assetClassName = ["reveal-media__asset", mediaClassName].filter(Boolean).join(" ");

  return (
    <div className={wrapperClassName} data-reveal-media data-testid="reveal-media">
      <Tag className={assetClassName} {...mediaProps} />
      <span className="reveal-media__dimmer" aria-hidden="true" />
    </div>
  );
}
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run the Step 2 command.

Expected: 1 test file passes; one video and two dimmers are rendered.

Suggested future commit: `feat: add reveal media wrapper`

---

### Task 3: Pointer coordinates and media markup

**Files:**
- Modify: `src/App.jsx:1-80, 257-285`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Consumes: `RevealMedia`
- Writes per wrapper: `--reveal-x`, `--reveal-y`, `data-reveal-active="true"`
- Clears wrappers on pointer leave, touch end, pointer cancel, and window blur

- [ ] **Step 1: Add failing pointer and media-instance tests**

Update the imports exactly as follows before adding the tests:

```jsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
```

```jsx
it("updates local reveal coordinates and clears them on leave", () => {
  let nextFrame;
  vi.stubGlobal("requestAnimationFrame", (callback) => {
    nextFrame = callback;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());

  render(<App />);
  const stage = screen.getByTestId("experience-stage");
  const media = screen.getAllByTestId("reveal-media");

  media.forEach((node, index) => {
    vi.spyOn(node, "getBoundingClientRect").mockReturnValue({
      left: 20 + index * 10,
      top: 30 + index * 10,
      right: 320,
      bottom: 330,
      width: 300,
      height: 300,
      x: 20,
      y: 30,
      toJSON: () => ({}),
    });
  });

  fireEvent.pointerMove(stage, { clientX: 180, clientY: 210 });
  act(() => nextFrame(16));

  expect(media[0].style.getPropertyValue("--reveal-x")).toBe("160px");
  expect(media[0].style.getPropertyValue("--reveal-y")).toBe("180px");
  expect(media[0]).toHaveAttribute("data-reveal-active", "true");

  fireEvent.pointerLeave(stage);
  expect(media[0]).not.toHaveAttribute("data-reveal-active");
  expect(media[0].style.getPropertyValue("--reveal-x")).toBe("-9999px");
});

it("keeps one video instance inside the interactive media layer", () => {
  render(<App />);
  const stage = screen.getByTestId("experience-stage");
  expect(stage.querySelectorAll(".experience-stage__media video")).toHaveLength(1);
});
```

Add this cleanup beside the suite:

```js
afterEach(() => {
  vi.unstubAllGlobals();
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/App.test.jsx -t "reveal coordinates|one video instance"
```

Expected: FAIL because the current media elements are not wrapped and no local reveal variables exist.

- [ ] **Step 3: Add pointer state and cleanup to App**

Add `useCallback` to the React import, import `RevealMedia`, and add these refs and callbacks inside `App`:

```jsx
const experienceRafRef = useRef(null);
const pendingPointerRef = useRef(null);

const clearExperienceReveal = useCallback(() => {
  const stage = experienceRef.current;
  if (!stage) return;

  stage.querySelectorAll("[data-reveal-media]").forEach((node) => {
    node.removeAttribute("data-reveal-active");
    node.style.setProperty("--reveal-x", "-9999px");
    node.style.setProperty("--reveal-y", "-9999px");
  });
}, []);

const handlePointerMove = (event) => {
  pendingPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
  if (experienceRafRef.current !== null) return;

  experienceRafRef.current = window.requestAnimationFrame(() => {
    experienceRafRef.current = null;
    const stage = experienceRef.current;
    const pointer = pendingPointerRef.current;
    if (!stage || !pointer) return;

    const stageRect = stage.getBoundingClientRect();
    stage.style.setProperty("--pointer-x", `${pointer.clientX - stageRect.left}px`);
    stage.style.setProperty("--pointer-y", `${pointer.clientY - stageRect.top}px`);

    stage.querySelectorAll("[data-reveal-media]").forEach((node) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--reveal-x", `${pointer.clientX - rect.left}px`);
      node.style.setProperty("--reveal-y", `${pointer.clientY - rect.top}px`);
      node.setAttribute("data-reveal-active", "true");
    });
  });
};

useEffect(() => {
  window.addEventListener("blur", clearExperienceReveal);
  return () => {
    window.removeEventListener("blur", clearExperienceReveal);
    if (experienceRafRef.current !== null) {
      window.cancelAnimationFrame(experienceRafRef.current);
    }
  };
}, [clearExperienceReveal]);
```

Replace the three direct media elements with explicit wrappers:

```jsx
<div className="experience-stage__media">
  <RevealMedia
    className="experience-media experience-media--fashion"
    src="/media/fashion-editorial.jpg"
    alt="红黑时尚编辑视觉"
    loading="lazy"
  />
  <RevealMedia
    className="experience-media experience-media--cyber"
    src="/media/cyber-editorial.jpg"
    alt="赛博角色编辑视觉"
    loading="lazy"
  />
  <RevealMedia
    as="video"
    className="experience-media experience-media--video"
    src="/media/cloud-fantasy.mp4"
    poster="/media/fantasy-character.jpg"
    muted
    loop
    playsInline
    autoPlay
    preload="metadata"
    aria-label="云海幻想短片"
  />
</div>
```

Add these stage handlers:

```jsx
onPointerMove={handlePointerMove}
onPointerLeave={clearExperienceReveal}
onPointerCancel={clearExperienceReveal}
onPointerUp={(event) => {
  if (event.pointerType === "touch") clearExperienceReveal();
}}
```

- [ ] **Step 4: Run the focused tests and confirm GREEN**

Run the Step 2 command.

Expected: both focused tests pass.

Suggested future commit: `feat: add pointer driven media reveal`

---

### Task 4: Install visual dependencies once and add LaserFlow with fallback

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/components/LaserFlow.jsx`
- Create: `src/components/LaserFlow.css`
- Create: `src/components/LaserFlow.test.jsx`

**Interfaces:**
- Produces: `LaserFlow({ pointerTargetRef, color, dpr, ...shaderProps })`
- Produces DOM contract: `[data-testid="laser-flow"]`, `data-laser-state="ready|fallback"`
- Consumes: React Bits source in `C:\Users\hp\.codex\attachments\d6bdc475-5e67-4d63-81f0-a8f0efaf0a4b\pasted-text.txt`

- [ ] **Step 1: Add all visual dependencies with one registry operation**

Run exactly once:

```powershell
pnpm add three gsap @gsap/react
```

Expected: `package.json` contains `three`, `gsap`, and `@gsap/react`; `pnpm-lock.yaml` updates; all three packages exist under `node_modules`. If the command fails, stop this task and report the single failure; do not search the pnpm store or retry the network.

- [ ] **Step 2: Write the failing WebGL fallback test**

```jsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("three", () => ({
  WebGLRenderer: class WebGLRenderer {
    constructor() {
      throw new Error("WebGL unavailable");
    }
  },
}));

import LaserFlow from "./LaserFlow";

describe("LaserFlow", () => {
  it("falls back without breaking the page when WebGL cannot initialize", async () => {
    render(<LaserFlow />);
    const flow = screen.getByTestId("laser-flow");
    await waitFor(() => expect(flow).toHaveAttribute("data-laser-state", "fallback"));
  });
});
```

- [ ] **Step 3: Run the fallback test and confirm RED**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/components/LaserFlow.test.jsx
```

Expected: FAIL because `LaserFlow.jsx` does not exist.

- [ ] **Step 4: Copy the supplied source and apply the integration changes**

Create `src/components/LaserFlow.jsx` from the complete `Full Component Source` block in the supplied attachment. Keep the `VERT` and `FRAG` shader strings byte-for-byte equivalent to the supplied source. Apply these exact integration changes around the shader:

The following block replaces only the existing exported component signature; the complete supplied function body follows it without deletion except for the explicit renderer, material, pointer-target, cleanup, dependency-array, and return-element replacements listed below.

```jsx
export const LaserFlow = ({
  pointerTargetRef,
  className,
  style,
  wispDensity = 0.72,
  dpr = 1.5,
  mouseSmoothTime = 0.08,
  mouseTiltStrength = 0.012,
  horizontalBeamOffset = 0.08,
  verticalBeamOffset = 0.02,
  flowSpeed = 0.26,
  verticalSizing = 1.8,
  horizontalSizing = 0.58,
  fogIntensity = 0.28,
  fogScale = 0.3,
  wispSpeed = 10,
  wispIntensity = 2.8,
  flowStrength = 0.2,
  decay = 1.1,
  falloffStart = 1.2,
  fogFallSpeed = 0.45,
  color = "#F6A04D",
}) => {
```

Replace renderer initialization with a safe transparent setup:

```jsx
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    logarithmicDepthBuffer: false,
  });
} catch {
  mount.dataset.laserState = "fallback";
  return undefined;
}

rendererRef.current = renderer;
mount.dataset.laserState = "ready";
renderer.setClearColor(0x000000, 0);
```

Use an alpha material:

```jsx
const material = new THREE.RawShaderMaterial({
  vertexShader: VERT,
  fragmentShader: FRAG,
  uniforms,
  transparent: true,
  depthTest: false,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
```

Bind supplied `onMove` / `onLeave` handlers to the experience stage instead of the pointer-transparent canvas:

```jsx
const pointerTarget = pointerTargetRef?.current ?? mount;
pointerTarget.addEventListener("pointermove", onMove, { passive: true });
pointerTarget.addEventListener("pointerdown", onMove, { passive: true });
pointerTarget.addEventListener("pointerenter", onMove, { passive: true });
pointerTarget.addEventListener("pointerleave", onLeave, { passive: true });
```

Remove those four listeners from `pointerTarget` during cleanup. Include `pointerTargetRef` in the effect dependencies. Return this concrete root element:

```jsx
return (
  <div
    ref={mountRef}
    className={`laser-flow-container ${className || ""}`}
    data-laser-state="ready"
    data-testid="laser-flow"
    style={style}
  />
);
```

Create `src/components/LaserFlow.css`:

```css
.laser-flow-container {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.laser-flow-container canvas {
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 5: Run the fallback test and confirm GREEN**

Run the Step 3 command.

Expected: fallback test passes without an uncaught WebGL error.

Suggested future commit: `feat: add resilient laser flow renderer`

---

### Task 5: Lazy-load LaserFlow in App

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Consumes: `useLaserFlowEnabled`, lazy `LaserFlow`, `experienceRef`
- Produces: `.experience-stage__laser` only when desktop and full-motion queries match

- [ ] **Step 1: Mock the lazy component and add failing loading-gate tests**

Add near the top of `src/App.test.jsx`:

```jsx
vi.mock("./components/LaserFlow", () => ({
  default: () => <div data-testid="laser-flow" />,
}));

function installExperienceMatchMedia({ desktop, motion }) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query) => ({
      matches: query.includes("min-width") ? desktop : motion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}
```

Add tests:

```jsx
it("loads LaserFlow on desktop when motion is allowed", async () => {
  installExperienceMatchMedia({ desktop: true, motion: true });
  render(<App />);
  expect(await screen.findByTestId("laser-flow")).toBeVisible();
});

it.each([
  { desktop: false, motion: true },
  { desktop: true, motion: false },
])("does not load LaserFlow for lightweight mode", async (matches) => {
  installExperienceMatchMedia(matches);
  render(<App />);
  expect(screen.queryByTestId("laser-flow")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/App.test.jsx -t "loads LaserFlow|lightweight mode"
```

Expected: desktop test fails because App does not render LaserFlow.

- [ ] **Step 3: Add the lazy import and gated layer**

Update React imports and component imports:

```jsx
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import useLaserFlowEnabled from "./hooks/useLaserFlowEnabled";

const LaserFlow = lazy(() => import("./components/LaserFlow"));
```

Inside `App`:

```jsx
const laserFlowEnabled = useLaserFlowEnabled();
```

Immediately inside `.experience-stage`, before `.experience-stage__media`:

```jsx
{laserFlowEnabled ? (
  <Suspense fallback={null}>
    <div className="experience-stage__laser" aria-hidden="true">
      <LaserFlow pointerTargetRef={experienceRef} color="#F6A04D" dpr={1.5} />
    </div>
  </Suspense>
) : null}
```

- [ ] **Step 4: Run the focused tests and confirm GREEN**

Run the Step 2 command.

Expected: desktop case renders the mocked flow; mobile and reduced-motion cases do not.

Suggested future commit: `feat: lazy load laser flow for desktop`

---

### Task 6: Layering, radial dimmer, mood filters, and responsive layout

**Files:**
- Modify: `src/styles.css:747-838, 1003-1046, 1058-1270, 1328 onward`

**Interfaces:**
- Consumes: `.experience-stage__laser`, `.experience-media--fashion|cyber|video`, `.reveal-media__asset`, `.reveal-media__dimmer`, `data-reveal-active`
- Produces: desktop `120px/240px` reveal and mobile `72px/150px` reveal

- [ ] **Step 1: Register animatable reveal radii**

Add after `:root`:

```css
@property --reveal-core {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}

@property --reveal-edge {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}
```

- [ ] **Step 2: Add the LaserFlow and reveal layers**

Replace the current direct `img` / `video` positioning block with:

```css
.experience-stage__laser {
  position: absolute;
  z-index: 0;
  inset: 0;
  opacity: 0.78;
  mix-blend-mode: screen;
  pointer-events: none;
}

.experience-stage__media {
  position: absolute;
  z-index: 1;
  inset: 0;
}

.reveal-media {
  --reveal-x: -9999px;
  --reveal-y: -9999px;
  --reveal-core: 0px;
  --reveal-edge: 0px;
  position: absolute;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(7, 28, 33, 0.34);
  isolation: isolate;
}

.reveal-media__asset {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 280ms ease;
}

.reveal-media__dimmer {
  position: absolute;
  z-index: 2;
  inset: -1px;
  background: rgba(5, 15, 21, 0.55);
  -webkit-mask-image: radial-gradient(
    circle at var(--reveal-x) var(--reveal-y),
    transparent 0 var(--reveal-core),
    rgba(0, 0, 0, 0.22) calc(var(--reveal-core) + 1px),
    #000 var(--reveal-edge)
  );
  mask-image: radial-gradient(
    circle at var(--reveal-x) var(--reveal-y),
    transparent 0 var(--reveal-core),
    rgba(0, 0, 0, 0.22) calc(var(--reveal-core) + 1px),
    #000 var(--reveal-edge)
  );
  transition: --reveal-core 220ms ease, --reveal-edge 220ms ease;
  pointer-events: none;
}

.reveal-media[data-reveal-active="true"] {
  --reveal-core: 120px;
  --reveal-edge: 240px;
}

.experience-media--fashion {
  top: 8%;
  right: 7%;
  width: min(31%, 420px);
  aspect-ratio: 3 / 4;
  transform: rotate(4deg);
}

.experience-media--cyber {
  right: 29%;
  bottom: 7%;
  width: min(22%, 300px);
  aspect-ratio: 3 / 4;
  transform: rotate(-5deg);
}

.experience-media--video {
  top: 14%;
  left: 7%;
  width: min(39%, 560px);
  aspect-ratio: 16 / 10;
  border-radius: 22px;
}
```

- [ ] **Step 3: Preserve mood filters on the asset only**

```css
.experience-stage[data-mood="soft"] .reveal-media__asset {
  filter: saturate(0.72) brightness(1.08);
}

.experience-stage[data-mood="pulse"] .reveal-media__asset {
  filter: saturate(1.18) contrast(1.05);
}
```

- [ ] **Step 4: Replace responsive child selectors with modifier classes**

Inside the existing `max-width: 1180px` media query, replace child-position selectors with:

```css
.experience-media--cyber {
  display: none;
}

.experience-media--fashion {
  width: 34%;
}
```

At `max-width: 760px`, retain the existing media geometry using:

```css
.experience-media--video {
  top: 0;
  left: 0;
  width: 78%;
  border-radius: 16px;
}

.experience-media--fashion {
  top: 86px;
  right: 0;
  width: 48%;
}

.reveal-media[data-reveal-active="true"] {
  --reveal-core: 72px;
  --reveal-edge: 150px;
}
```

At `prefers-reduced-motion: reduce`, add:

```css
.experience-stage__laser {
  display: none;
}

.reveal-media__dimmer {
  transition: none;
}
```

- [ ] **Step 5: Run all component and App tests**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/components/RevealMedia.test.jsx src/components/LaserFlow.test.jsx src/hooks/useLaserFlowEnabled.test.js src/App.test.jsx
```

Expected: all focused suites pass with zero failures.

Suggested future commit: `style: add laser reveal experience layers`

---

### Task 7: Hero SplitText animation

**Files:**
- Create: `src/components/SplitText.jsx`
- Create: `src/components/SplitText.test.jsx`
- Modify: `src/App.jsx:1-20, 124-126`
- Modify: `src/App.test.jsx`
- Modify: `src/styles.css:159-173, 1101-1105`

**Interfaces:**
- Produces: `SplitText({ tag, text, className, delay, duration, ease, splitType, from, to, threshold, rootMargin, textAlign, onLetterAnimationComplete, ...elementProps })`
- Produces DOM contract: `h1#hero-title.hero__title.split-parent`, `.split-char`, `.split-char--separator`
- Consumes: `gsap`, `gsap/ScrollTrigger`, `gsap/SplitText`, `@gsap/react`

- [ ] **Step 1: Write the failing SplitText component tests**

Create `src/components/SplitText.test.jsx`:

```jsx
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const animation = vi.hoisted(() => ({
  fromTo: vi.fn(() => ({ kill: vi.fn() })),
  getAll: vi.fn(() => []),
  registerPlugin: vi.fn(),
  revert: vi.fn(),
  splitCalls: [],
  throwOnSplit: false,
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: animation.fromTo,
    registerPlugin: animation.registerPlugin,
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { getAll: animation.getAll },
}));

vi.mock("gsap/SplitText", () => ({
  SplitText: class MockSplitText {
    constructor(element, options) {
      if (animation.throwOnSplit) throw new Error("split unavailable");
      animation.splitCalls.push({ element, options });
      this.revert = animation.revert;
      const chars = [...element.textContent].map((character) => {
        const node = document.createElement("span");
        node.className = "split-char";
        node.textContent = character;
        return node;
      });
      element.replaceChildren(...chars);
      options.onSplit({ chars, words: [], lines: [] });
    }
  },
}));

vi.mock("@gsap/react", async () => {
  const React = await import("react");
  return {
    useGSAP(callback, { dependencies = [] }) {
      React.useEffect(callback, dependencies);
    },
  };
});

import SplitText from "./SplitText";

function installMotionPreference(reduced) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduced,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  animation.fromTo.mockClear();
  animation.getAll.mockReturnValue([]);
  animation.revert.mockClear();
  animation.splitCalls.length = 0;
  animation.throwOnSplit = false;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SplitText", () => {
  it("splits characters once and marks the middle separator", async () => {
    installMotionPreference(false);
    const { rerender } = render(
      <SplitText
        id="hero-title"
        aria-label="AIGC-CHEN · WELCOME"
        tag="h1"
        text="AIGC-CHEN·WELCOME"
        delay={38}
        duration={0.85}
        from={{ opacity: 0, y: "0.42em" }}
        to={{ opacity: 1, y: 0 }}
      />,
    );

    await waitFor(() => expect(animation.splitCalls)).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "AIGC-CHEN · WELCOME" })).toHaveAttribute(
      "id",
      "hero-title",
    );
    expect(document.querySelector(".split-char--separator")).toHaveTextContent("·");
    expect(animation.fromTo.mock.calls[0][2]).toMatchObject({
      duration: 0.85,
      stagger: 0.038,
      scrollTrigger: { once: true },
    });

    rerender(
      <SplitText
        id="hero-title"
        aria-label="AIGC-CHEN · WELCOME"
        tag="h1"
        text="AIGC-CHEN·WELCOME"
        delay={38}
        duration={0.85}
        from={{ opacity: 0, y: "0.42em" }}
        to={{ opacity: 1, y: 0 }}
      />,
    );
    expect(animation.splitCalls).toHaveLength(1);
  });

  it("renders static text when reduced motion is requested", async () => {
    installMotionPreference(true);
    render(<SplitText tag="h1" text="AIGC-CHEN·WELCOME" />);
    expect(screen.getByRole("heading")).toHaveTextContent("AIGC-CHEN·WELCOME");
    await Promise.resolve();
    expect(animation.splitCalls).toHaveLength(0);
  });

  it("keeps readable static text when splitting fails", async () => {
    installMotionPreference(false);
    animation.throwOnSplit = true;
    render(<SplitText tag="h1" text="AIGC-CHEN·WELCOME" />);
    await waitFor(() =>
      expect(screen.getByRole("heading")).toHaveAttribute("data-split-state", "fallback"),
    );
    expect(screen.getByRole("heading")).toHaveTextContent("AIGC-CHEN·WELCOME");
  });

  it("reverts its own split instance on unmount", async () => {
    installMotionPreference(false);
    const { unmount } = render(<SplitText tag="h1" text="AIGC-CHEN·WELCOME" />);
    await waitFor(() => expect(animation.splitCalls)).toHaveLength(1);
    unmount();
    expect(animation.revert).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the SplitText tests and confirm RED**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/components/SplitText.test.jsx
```

Expected: FAIL because `src/components/SplitText.jsx` does not exist.

- [ ] **Step 3: Implement the resilient React Bits SplitText component**

Create `src/components/SplitText.jsx`:

```jsx
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function readReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

const SplitText = ({
  text = "",
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
  style,
  ...elementProps
}) => {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    let active = true;
    const fonts = document.fonts;
    if (!fonts || fonts.status === "loaded") {
      setFontsLoaded(true);
      return undefined;
    }
    fonts.ready.then(() => {
      if (active) setFontsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded || reducedMotion) return undefined;
      if (animationCompletedRef.current) return undefined;
      const element = ref.current;

      if (element._rbsplitInstance) {
        try {
          element._rbsplitInstance.revert();
        } catch {
          // A stale third-party instance must not block a readable title.
        }
        element._rbsplitInstance = null;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? Number.parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
      const sign =
        marginValue === 0
          ? ""
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      let splitInstance;
      try {
        splitInstance = new GSAPSplitText(element, {
          type: splitType,
          smartWrap: true,
          autoSplit: splitType === "lines",
          linesClass: "split-line",
          wordsClass: "split-word",
          charsClass: "split-char",
          reduceWhiteSpace: false,
          onSplit: (self) => {
            self.chars.forEach((character) => {
              if (character.textContent === "·") character.classList.add("split-char--separator");
            });

            let targets;
            if (splitType.includes("chars") && self.chars.length) targets = self.chars;
            if (!targets && splitType.includes("words") && self.words.length) targets = self.words;
            if (!targets && splitType.includes("lines") && self.lines.length) targets = self.lines;
            if (!targets) targets = self.chars || self.words || self.lines;
            if (!targets?.length) return undefined;

            return gsap.fromTo(
              targets,
              { ...from },
              {
                ...to,
                duration,
                ease,
                stagger: delay / 1000,
                scrollTrigger: {
                  trigger: element,
                  start,
                  once: true,
                  fastScrollEnd: true,
                  anticipatePin: 0.4,
                },
                onComplete: () => {
                  animationCompletedRef.current = true;
                  onCompleteRef.current?.();
                },
                willChange: "transform, opacity",
                force3D: true,
              },
            );
          },
        });
      } catch {
        element.textContent = text;
        element.dataset.splitState = "fallback";
        animationCompletedRef.current = true;
        return undefined;
      }

      element._rbsplitInstance = splitInstance;
      element.dataset.splitState = "ready";

      return () => {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === element) trigger.kill();
        });
        try {
          splitInstance.revert();
        } catch {
          element.textContent = text;
        }
        element._rbsplitInstance = null;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
        reducedMotion,
      ],
      scope: ref,
    },
  );

  const Tag = tag || "p";
  const classes = ["split-parent", className].filter(Boolean).join(" ");
  return (
    <Tag
      {...elementProps}
      ref={ref}
      className={classes}
      style={{
        display: "block",
        overflow: "hidden",
        textAlign,
        wordWrap: "break-word",
        willChange: reducedMotion ? "auto" : "transform, opacity",
        ...style,
      }}
    >
      {text}
    </Tag>
  );
};

export default SplitText;
```

- [ ] **Step 4: Run the SplitText tests and confirm GREEN**

Run the Step 2 command.

Expected: 1 test file and 4 tests pass.

- [ ] **Step 5: Add the failing App integration assertion**

Add to `src/App.test.jsx`:

```jsx
it("preserves the animated hero title semantics", () => {
  render(<App />);
  const heading = screen.getByRole("heading", { level: 1, name: "AIGC-CHEN · WELCOME" });
  expect(heading).toHaveAttribute("id", "hero-title");
  expect(heading).toHaveClass("hero__title", "split-parent");
});
```

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/App.test.jsx -t "hero title semantics"
```

Expected: FAIL because the current `h1` is not rendered through `SplitText` and lacks the new classes and accessible label.

- [ ] **Step 6: Integrate SplitText and preserve the title geometry**

Add the import in `src/App.jsx`:

```jsx
import SplitText from "./components/SplitText";
```

Replace the existing hero `h1` with:

```jsx
<SplitText
  id="hero-title"
  aria-label="AIGC-CHEN · WELCOME"
  tag="h1"
  className="hero__title"
  text="AIGC-CHEN·WELCOME"
  splitType="chars"
  delay={38}
  duration={0.85}
  ease="power3.out"
  from={{ opacity: 0, y: "0.42em" }}
  to={{ opacity: 1, y: 0 }}
  threshold={0.1}
  rootMargin="-100px"
  textAlign="left"
/>
```

Replace the existing `.hero h1 span` rule in `src/styles.css` with:

```css
.hero__title.split-parent {
  width: 100%;
  white-space: nowrap;
}

.hero__title .split-char {
  display: inline-block;
}

.hero__title .split-char--separator {
  margin: 0 0.05em;
}
```

- [ ] **Step 7: Run SplitText and App tests together**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/components/SplitText.test.jsx src/App.test.jsx
```

Expected: both test files pass, the title remains a unique `h1#hero-title`, and reduced-motion rendering remains static.

Suggested future commit: `feat: animate hero title with split text`

---

### Task 8: Full verification and visual acceptance

**Files:**
- Verify only; modify the smallest relevant file if a verified defect is found

**Interfaces:**
- Final deliverable: `http://127.0.0.1:4173/` with Hero and `#experience` both verified

- [ ] **Step 1: Run the complete test suite**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run
```

Expected: every test file and test case passes.

- [ ] **Step 2: Run the production build**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vite\bin\vite.js' build
```

Expected: Vite exits `0`, emits `dist`, and creates a separate lazy LaserFlow/Three.js chunk.

- [ ] **Step 3: Verify the real desktop interaction**

Open `http://127.0.0.1:4173/` with the Browser skill and confirm:

1. The hero title enters character-by-character from below, remains one line, and does not replay after scrolling away and back.
2. The title keeps its original size, tight spacing, left alignment, and center-dot spacing.
3. Warm orange-gold LaserFlow is visible behind media.
4. All three media are dimmed before pointer entry.
5. Pointer movement reveals a soft, local full-brightness region on both images and the video.
6. Only one video exists in `.experience-stage__media`, continues playing, and does not restart during pointer movement.
7. Text and mood buttons remain above the effects and clickable.
8. All three mood buttons still change color treatment while reveal changes brightness only.

- [ ] **Step 4: Verify lightweight behavior**

Using an available viewport override or responsive browser surface, verify at `390 × 844`:

1. No `[data-testid="laser-flow"]` is mounted.
2. Touch/pointer movement still updates the reveal position.
3. The section scrolls smoothly and video remains playable.
4. The hero title remains readable without horizontal page overflow.

Also emulate `prefers-reduced-motion: reduce` if the selected browser supports it and confirm both LaserFlow and SplitText are disabled while all content remains visible; otherwise rely on the passing media-query unit tests and CSS rule inspection.

- [ ] **Step 5: Check browser errors and preserve the preview**

Confirm the browser error log is empty. Leave the final deliverable tab at `http://127.0.0.1:4173/` and keep the local preview server running.

Suggested future commit: `feat: complete portfolio motion experience`
