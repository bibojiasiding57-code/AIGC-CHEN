# Video Loading Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve perceived loading and buffering feedback for GitHub LFS videos without changing the existing card layout or interactions.

**Architecture:** `MediaCard` owns viewport prewarming and preview buffering state; `WorksVideoDialog` owns priority playback and modal buffering state. A shared CSS loading overlay is pointer-transparent and occupies existing media bounds.

**Tech Stack:** React 19, HTMLVideoElement, IntersectionObserver, Vitest, Testing Library, CSS.

## Global Constraints

- Preserve the current grid, card dimensions, border radius, play button, click, double-click, hover preview, and mobile behavior.
- Add no third-party dependency.
- Every loading overlay must use `pointer-events: none`.
- Card videos start with `preload="metadata"`; dialog video uses `preload="auto"`.

---

### Task 1: Viewport-aware card video loading

**Files:**
- Modify: `src/components/MediaCard.test.jsx`
- Modify: `src/components/MediaCard.jsx`

**Interfaces:**
- Consumes: `project.src`, existing `onOpen(project)`.
- Produces: card-level `isBuffering` state and viewport-triggered `video.load()`.

- [ ] **Step 1: Write failing tests**

Add tests that stub `IntersectionObserver`, assert `load()` is called when the card enters a `rootMargin: "320px"` observation zone, assert `waiting` renders `.media-loading`, and assert `canPlay`/`playing` removes it.

```jsx
it("prewarms video near the viewport", () => {
  const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  const { container } = render(<MediaCard project={project} />);
  intersectionCallback([{ isIntersecting: true }]);
  expect(load).toHaveBeenCalledTimes(1);
  expect(container.querySelector("video")).toHaveAttribute("preload", "metadata");
});

it("shows pointer-transparent buffering feedback", () => {
  render(<MediaCard project={project} />);
  const video = screen.getByLabelText(`${project.title} 视频预览`);
  fireEvent.waiting(video);
  expect(screen.getByRole("status", { name: "视频缓冲中" })).toBeInTheDocument();
  fireEvent.canPlay(video);
  expect(screen.queryByRole("status", { name: "视频缓冲中" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node node_modules/vitest/vitest.mjs run src/components/MediaCard.test.jsx
```

Expected: FAIL because no observer prewarm or loading status exists.

- [ ] **Step 3: Implement minimal card behavior**

Add `visualRef`, `isBuffering`, and an effect that observes the visual container with `rootMargin: "320px"`, calls `media.load()` once, then disconnects. Set buffering before hover play; clear it on `canplay` and `playing`; show:

```jsx
{isBuffering && !failed ? (
  <span className="media-loading" role="status" aria-label="视频缓冲中">
    <span className="media-loading__spinner" aria-hidden="true" />
    <span>视频缓冲中</span>
  </span>
) : null}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same Vitest command. Expected: all `MediaCard` tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/components/MediaCard.jsx src/components/MediaCard.test.jsx
git commit -m "feat: prewarm project video previews"
```

### Task 2: Priority modal playback with buffering feedback

**Files:**
- Modify: `src/components/WorksVideoDialog.test.jsx`
- Modify: `src/components/WorksVideoDialog.jsx`

**Interfaces:**
- Consumes: selected `project` and existing `onClose()`.
- Produces: modal `isBuffering` UI around the existing controlled player.

- [ ] **Step 1: Write failing tests**

Assert the modal video has `preload="auto"`; `waiting` displays the loading status; `playing` hides it; existing close/reset tests remain unchanged.

```jsx
expect(video).toHaveAttribute("preload", "auto");
fireEvent.waiting(video);
expect(screen.getByRole("status", { name: "视频缓冲中" })).toBeInTheDocument();
fireEvent.playing(video);
expect(screen.queryByRole("status", { name: "视频缓冲中" })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run focused test and verify RED**

```powershell
node node_modules/vitest/vitest.mjs run src/components/WorksVideoDialog.test.jsx
```

Expected: FAIL because preload is metadata and no status exists.

- [ ] **Step 3: Implement minimal modal behavior**

Add `isBuffering`; reset it when project changes; set it on `loadstart`, `waiting`, and `stalled`; clear it on `canplay`, `playing`, and `error`. Wrap the video in `.works-dialog__media` and render the shared loading markup. Change only `preload` to `auto`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same focused Vitest command. Expected: all dialog tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/components/WorksVideoDialog.jsx src/components/WorksVideoDialog.test.jsx
git commit -m "feat: add modal video buffering feedback"
```

### Task 3: Pointer-safe loading styles and deployment verification

**Files:**
- Modify: `src/styles.css`
- Modify: `src/styles.test.js`

**Interfaces:**
- Consumes: `.media-loading`, `.media-loading__spinner`, `.works-dialog__media`.
- Produces: a visually contained, non-interactive loading overlay.

- [ ] **Step 1: Write failing style assertions**

Add assertions that the stylesheet contains `.media-loading`, `pointer-events: none`, and a reduced-motion rule that disables spinner animation.

- [ ] **Step 2: Run style test and verify RED**

```powershell
node node_modules/vitest/vitest.mjs run src/styles.test.js
```

Expected: FAIL because loading styles do not exist.

- [ ] **Step 3: Add minimal styles**

```css
.media-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-content: center;
  gap: 0.55rem;
  color: rgba(255, 255, 255, 0.88);
  background: linear-gradient(180deg, transparent 35%, rgba(6, 18, 22, 0.28));
  pointer-events: none;
}

.media-loading__spinner {
  width: 1.5rem;
  aspect-ratio: 1;
  margin-inline: auto;
  border: 2px solid rgba(255, 255, 255, 0.28);
  border-top-color: #fff;
  border-radius: 50%;
  animation: media-loading-spin 0.8s linear infinite;
}

.works-dialog__media { position: relative; }

@keyframes media-loading-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .media-loading__spinner { animation: none; }
}
```

- [ ] **Step 4: Run full verification**

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
```

Expected: 60 existing tests plus new tests pass; Vite exits 0.

- [ ] **Step 5: Deploy and verify**

Deploy with the linked Vercel project, inspect `aigcchen.cn`, and verify the domain status and production deployment are Ready. Verify DNS separately after the user adds `A @ 76.76.21.21`.

- [ ] **Step 6: Commit**

```powershell
git add src/styles.css src/styles.test.js
git commit -m "style: add video buffering indicator"
```
