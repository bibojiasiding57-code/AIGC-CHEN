# Adaptive Video Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver skeleton-first, viewport-aware video loading with delayed resource release and mobile-safe modal playback.

**Architecture:** A focused `useAdaptiveVideoSource` hook owns source attachment, two observer zones, connection-aware prewarming, and delayed release. `MediaCard` and `WorksVideoDialog` retain their existing public interfaces while consuming explicit source/readiness state and rendering one pointer-transparent skeleton component.

**Tech Stack:** React 19, IntersectionObserver, Network Information API feature detection, HTMLVideoElement, Vitest, Testing Library, CSS.

## Global Constraints

- Keep the current project grid, card dimensions, corner radii, play button, click, double-click, hover preview, modal controls, and responsive breakpoints unchanged.
- Use `rootMargin: "200px 0px"` for card prewarming and `20_000` ms for delayed release.
- Disable automatic offscreen prewarming when `saveData === true` or `effectiveType` is `2g`/`slow-2g`.
- Loading and skeleton layers must use `pointer-events: none`.
- Add no runtime dependency.

---

### Task 1: Adaptive video source hook

**Files:**
- Create: `src/hooks/useAdaptiveVideoSource.js`
- Create: `src/hooks/useAdaptiveVideoSource.test.jsx`

**Interfaces:**
- Consumes: `{ source, mediaRef, enabled = true, releaseDelay = 20_000 }`.
- Produces: `{ containerRef, activeSource, isNearViewport, isInViewport, requestSource, releaseSource }`.

- [ ] **Step 1: Write failing tests**

Cover two observer instances, prewarm `rootMargin`, source restoration at 200px, pause on viewport exit, delayed source removal, cancellation on re-entry, and Save-Data/2G suppression.

```jsx
const Probe = ({ source = "/video.mp4" }) => {
  const mediaRef = useRef(null);
  const state = useAdaptiveVideoSource({ source, mediaRef, releaseDelay: 20_000 });
  return <div ref={state.containerRef}><video ref={mediaRef} src={state.activeSource} /></div>;
};
```

- [ ] **Step 2: Run RED**

```powershell
node node_modules/vitest/vitest.mjs run src/hooks/useAdaptiveVideoSource.test.jsx
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the hook**

Use two observers: prewarm with `{ rootMargin: "200px 0px" }`, active with default viewport. Store the release timer in a ref, clear it on re-entry/unmount, pause on active exit, and after 20 seconds set `activeSource` to `undefined`, remove the media `src` attribute, and call `load()`. `requestSource()` restores the original source synchronously for user interaction.

- [ ] **Step 4: Run GREEN and commit**

Expected: all hook tests pass.

```powershell
git add src/hooks/useAdaptiveVideoSource.js src/hooks/useAdaptiveVideoSource.test.jsx
git commit -m "feat: add adaptive video source lifecycle"
```

### Task 2: Skeleton-first MediaCard

**Files:**
- Create: `src/components/VideoLoadingOverlay.jsx`
- Modify: `src/components/MediaCard.jsx`
- Modify: `src/components/MediaCard.test.jsx`

**Interfaces:**
- Consumes: hook output and existing `project`, `featured`, `onOpen` props.
- Produces: `VideoLoadingOverlay({ phase, label })`, where phase is `skeleton | buffering | hidden`.

- [ ] **Step 1: Write failing tests**

Assert initial skeleton presence, `loadedData`/`canPlay` removal, `waiting` buffering label, source restoration before hover play, viewport-exit pause, and unchanged play-button/double-click callbacks.

- [ ] **Step 2: Run RED**

```powershell
node node_modules/vitest/vitest.mjs run src/components/MediaCard.test.jsx
```

- [ ] **Step 3: Implement minimal integration**

Replace the card-local observer with `useAdaptiveVideoSource`. Track `hasFrame` and `isBuffering`; call `requestSource()` before play; render `VideoLoadingOverlay` until `loadeddata` or `canplay`; retain the existing fallback on error and all current event handlers.

- [ ] **Step 4: Run GREEN and commit**

```powershell
git add src/components/VideoLoadingOverlay.jsx src/components/MediaCard.jsx src/components/MediaCard.test.jsx
git commit -m "feat: add skeleton-first project videos"
```

### Task 3: Mobile-safe dialog lifecycle

**Files:**
- Modify: `src/components/WorksVideoDialog.jsx`
- Modify: `src/components/WorksVideoDialog.test.jsx`

**Interfaces:**
- Consumes: existing `project`, `onClose`, and `VideoLoadingOverlay`.
- Produces: source-attached active modal and source-free closed modal.

- [ ] **Step 1: Write failing tests**

Assert skeleton before `loadedData`, buffering on `waiting`, hidden overlay on `playing`, `preload="auto"`, `playsInline`, controls, and removal of `src` plus `load()` on close/unmount.

- [ ] **Step 2: Run RED**

```powershell
node node_modules/vitest/vitest.mjs run src/components/WorksVideoDialog.test.jsx
```

- [ ] **Step 3: Implement modal lifecycle**

Track `activeSource`, `hasFrame`, and `isBuffering`. Attach only the selected source, request playback after modal open, unload in the existing stop/close path, and reuse `VideoLoadingOverlay`. Do not alter native controls or close behavior.

- [ ] **Step 4: Run GREEN and commit**

```powershell
git add src/components/WorksVideoDialog.jsx src/components/WorksVideoDialog.test.jsx
git commit -m "feat: optimize modal video lifecycle"
```

### Task 4: Glass skeleton styling and mobile verification

**Files:**
- Modify: `src/styles.css`
- Modify: `src/styles.test.js`

**Interfaces:**
- Consumes: `.video-loading`, `.video-loading--skeleton`, `.video-loading--buffering`, `.video-loading__shimmer`, `.video-loading__spinner`.
- Produces: contained glass loading treatment with reduced-motion fallback.

- [ ] **Step 1: Write failing style tests**

Assert pointer transparency, warm glass gradient, shimmer keyframes, play-button z-index dominance, modal containment, and reduced-motion animation disablement.

- [ ] **Step 2: Run RED**

```powershell
node node_modules/vitest/vitest.mjs run src/styles.test.js
```

- [ ] **Step 3: Implement styles**

Use absolute containment, `backdrop-filter: blur(14px)`, warm translucent gradients, a low-contrast shimmer, 180ms opacity transitions, `z-index: 1`, and existing play button `z-index: 2`. Keep all geometry declarations unchanged.

- [ ] **Step 4: Run full verification**

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
git diff --check
```

Expected: all tests pass, Vite exits 0, and no whitespace errors.

- [ ] **Step 5: Commit, merge, push, and deploy**

Commit styles, merge the isolated branch to `main`, rerun the complete test suite on `main`, push GitHub, deploy the linked Vercel project with `--prod --yes`, and inspect `aigcchen.cn` for `Ready` status.
