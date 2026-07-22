# Poster-Protected Video Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent every Works video black frame, restore the always-running Interactive Experience video, and load the 14 large card videos only after explicit user intent.

**Architecture:** Keep poster visibility as an independent layer rather than relying on the browser video element. Narrow `useAdaptiveVideoSource` to viewport bookkeeping and delayed release; explicit card intent owns source attachment. Give the Interactive Experience a dedicated component that never uses the unloading hook, while the modal broadcasts a preview-pause event before loading its selected source.

**Tech Stack:** React 19, Vite 6, Vitest, Testing Library, WebP posters generated with FFmpeg, Vercel CLI.

## Global Constraints

- Preserve all 14 project ids, order, titles, categories, years, sources, layout, card controls, and modal interactions.
- Store posters at `public/media/works/posters/<project-id>.webp` and bind them through `project.poster`.
- Card videos use `preload="metadata"`, start without `src`, and attach only after hover, focus, play-button, or double-click intent.
- The Interactive Experience video always keeps a valid source with `autoPlay`, `muted`, `loop`, and `playsInline`.
- Poster and Loading overlays remain `pointer-events: none` and hide immediately on `loadeddata`, `canplay`, or `playing`.
- Original Works videos remain remote-hosted and excluded from Vercel uploads.

---

### Task 1: Generate and Bind 14 WebP Posters

**Files:**
- Create: `public/media/works/posters/*.webp`
- Modify: `src/data/portfolio.js`
- Modify: `.vercelignore`
- Test: `src/data/portfolio.test.js`

**Interfaces:**
- Produces: every project has `poster: "/media/works/posters/<id>.webp"`.
- Consumes: stable project ids and local `public/media/works/*.mp4` files.

- [ ] **Step 1: Write the failing data test**

```js
it("binds one stable WebP poster to every project", () => {
  expect(projects).toHaveLength(14);
  expect(projects.every(({ id, poster }) => poster === `/media/works/posters/${id}.webp`)).toBe(true);
  expect(new Set(projects.map(({ poster }) => poster)).size).toBe(14);
});
```

- [ ] **Step 2: Verify RED**

Run: `node node_modules/vitest/vitest.mjs run src/data/portfolio.test.js`

Expected: FAIL because `poster` is undefined.

- [ ] **Step 3: Generate deterministic WebP frames**

For each project source run this pattern, substituting source and id:

```powershell
ffmpeg -y -ss 00:00:01 -i public/media/works/avatr-ad.mp4 -frames:v 1 -vf "scale=1280:-2:force_original_aspect_ratio=decrease" -c:v libwebp -quality 80 public/media/works/posters/avatr-ad.webp
```

Verify 14 non-empty, decodable outputs.

- [ ] **Step 4: Bind posters**

Add to each project object:

```js
poster: "/media/works/posters/avatr-ad.webp",
```

Replace the broad Vercel exclusion with a file-only rule so posters remain deployable:

```text
public/media/works/*.mp4
```

- [ ] **Step 5: Verify GREEN and commit**

Run the focused test; expect all portfolio tests to pass. Then:

```bash
git add .vercelignore public/media/works/posters src/data/portfolio.js src/data/portfolio.test.js
git commit -m "feat: add poster protection for project videos"
```

---

### Task 2: Make Card Loading Explicitly Intent-Driven

**Files:**
- Modify: `src/hooks/useAdaptiveVideoSource.js`
- Modify: `src/hooks/useAdaptiveVideoSource.test.jsx`
- Modify: `src/components/MediaCard.jsx`
- Modify: `src/components/MediaCard.test.jsx`

**Interfaces:**
- Keeps the hook's current return API.
- Changes near-viewport observation so it never calls `requestSource()`.

- [ ] **Step 1: Write failing observer test**

```jsx
it("tracks proximity without attaching the source automatically", () => {
  render(<Harness />);
  act(() => observers[0].callback([{ isIntersecting: true }]));
  expect(screen.getByTestId("active-source")).toHaveTextContent("detached");
  expect(load).not.toHaveBeenCalled();
});
```

Keep a separate test proving `requestSource()` attaches the source and calls `load()`.

- [ ] **Step 2: Verify RED**

Run: `node node_modules/vitest/vitest.mjs run src/hooks/useAdaptiveVideoSource.test.jsx`

Expected: FAIL because the near observer currently requests the source.

- [ ] **Step 3: Remove automatic source attachment**

Use this near-observer body and do not request a source in the no-Observer fallback:

```js
if (isNear) {
  clearReleaseTimer();
  return;
}
clearReleaseTimer();
releaseTimerRef.current = setTimeout(releaseSource, releaseDelay);
```

- [ ] **Step 4: Verify hook GREEN**

Run the focused hook test; expect all hook tests to pass.

- [ ] **Step 5: Write failing poster-layer test**

```jsx
it("keeps its poster until a playable frame exists", () => {
  const { container } = render(<MediaCard project={project} />);
  const video = screen.getByLabelText(`${project.title} 视频预览`);
  const poster = container.querySelector(".media-card__poster");
  expect(video).not.toHaveAttribute("src");
  expect(video).toHaveAttribute("preload", "metadata");
  expect(poster).toHaveAttribute("src", project.poster);
  expect(poster).toHaveAttribute("data-visible", "true");
  fireEvent.pointerEnter(video.parentElement);
  fireEvent.canPlay(video);
  expect(poster).toHaveAttribute("data-visible", "false");
  fireEvent.waiting(video);
  expect(poster).toHaveAttribute("data-visible", "true");
});
```

- [ ] **Step 6: Verify RED**

Run: `node node_modules/vitest/vitest.mjs run src/components/MediaCard.test.jsx`

Expected: FAIL because `.media-card__poster` does not exist.

- [ ] **Step 7: Implement poster state**

Render after the video:

```jsx
<img className="media-card__poster" src={project.poster} alt="" aria-hidden="true" data-visible={!hasFrame || isBuffering} />
```

Set `hasFrame(false)` and buffering true on `loadstart`, `waiting`, and `stalled`. Set `hasFrame(true)` and buffering false on `loadeddata`, `canplay`, and `playing`. Keep `requestSource()` only in intent handlers.

- [ ] **Step 8: Verify GREEN and commit**

Run both focused test files; expect all tests to pass. Then:

```bash
git add src/hooks/useAdaptiveVideoSource.js src/hooks/useAdaptiveVideoSource.test.jsx src/components/MediaCard.jsx src/components/MediaCard.test.jsx
git commit -m "fix: load project videos only on user intent"
```

---

### Task 3: Give Interactive Video a Permanent Lifecycle

**Files:**
- Create: `src/components/ExperienceVideo.jsx`
- Create: `src/components/ExperienceVideo.test.jsx`
- Modify: `src/components/RevealMedia.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Produces: `ExperienceVideo({ src, className, ariaLabel })`.
- Consumes: `RevealMedia`, the Test Success source, and visibility/media events.

- [ ] **Step 1: Write failing component tests**

Assert a rendered video always has `src`, `autoplay`, `muted`, `loop`, `playsinline`, and `preload="metadata"`. Mock `play()` and assert calls on mount, `canplay`, and visible `visibilitychange`.

- [ ] **Step 2: Verify RED**

Run: `node node_modules/vitest/vitest.mjs run src/components/ExperienceVideo.test.jsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement permanent playback**

```jsx
export default function ExperienceVideo({ src, className = "", ariaLabel }) {
  const videoRef = useRef(null);
  const ensurePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || document.hidden) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);
  useEffect(() => {
    ensurePlayback();
    document.addEventListener("visibilitychange", ensurePlayback);
    return () => document.removeEventListener("visibilitychange", ensurePlayback);
  }, [ensurePlayback]);
  return <RevealMedia as="video" mediaRef={videoRef} className={className} src={src} muted loop playsInline autoPlay preload="metadata" onCanPlay={ensurePlayback} aria-label={ariaLabel} />;
}
```

Extend `RevealMedia` with `mediaRef` and pass it as the rendered asset's `ref`.

- [ ] **Step 4: Replace only the Interactive left video**

```jsx
<ExperienceVideo
  className="experience-media experience-media--video"
  src={resolveVideoSrc("/media/works/test-success.mp4")}
  ariaLabel="测试成功动态影像"
/>
```

Do not modify the two right-side image cards.

- [ ] **Step 5: Verify GREEN and commit**

Run ExperienceVideo and App tests; expect all to pass. Then:

```bash
git add src/components/ExperienceVideo.jsx src/components/ExperienceVideo.test.jsx src/components/RevealMedia.jsx src/App.jsx src/App.test.jsx
git commit -m "fix: keep interactive experience video alive"
```

---

### Task 4: Prioritize Modal Playback

**Files:**
- Modify: `src/components/WorksVideoDialog.jsx`
- Modify: `src/components/WorksVideoDialog.test.jsx`
- Modify: `src/components/MediaCard.jsx`
- Modify: `src/components/MediaCard.test.jsx`

**Interfaces:**
- Produces event `aigcchen:modal-video-open` to pause mounted card previews.
- Consumes `project.poster` for modal protection.

- [ ] **Step 1: Write failing coordination tests**

Assert dialog open dispatches the event; its poster is visible before readiness, hidden on `canplay`, and visible on `waiting`. Dispatch the event in a card test and assert preview `pause()`.

- [ ] **Step 2: Verify RED**

Run both focused component test files. Expected: FAIL because the event and dialog poster do not exist.

- [ ] **Step 3: Implement modal priority**

Before source attachment:

```js
window.dispatchEvent(new CustomEvent("aigcchen:modal-video-open"));
```

Register `resetPreview` for this event in `MediaCard`, with cleanup. Render:

```jsx
<img className="works-dialog__poster" src={project.poster} alt="" aria-hidden="true" data-visible={!hasFrame || isBuffering} />
```

Set `hasFrame(false)` on `waiting` and `stalled`; set true and clear Loading on `loadeddata`, `canplay`, and `playing`.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests; expect all to pass. Then:

```bash
git add src/components/WorksVideoDialog.jsx src/components/WorksVideoDialog.test.jsx src/components/MediaCard.jsx src/components/MediaCard.test.jsx
git commit -m "fix: prioritize selected project playback"
```

---

### Task 5: Style Poster Transitions Without Geometry Changes

**Files:**
- Modify: `src/styles.css`
- Modify: `src/styles.test.js`

- [ ] **Step 1: Write failing style tests**

Assert both poster selectors are absolute covers with `object-fit: cover`, opacity transition, and `pointer-events: none`; assert `data-visible="false"` gives opacity zero and controls retain z-index 2 or higher.

- [ ] **Step 2: Verify RED**

Run: `node node_modules/vitest/vitest.mjs run src/styles.test.js`

Expected: FAIL because poster styles do not exist.

- [ ] **Step 3: Add poster-only styles**

```css
.media-card__poster,
.works-dialog__poster {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 1;
  transition: opacity 220ms ease;
  pointer-events: none;
}
.media-card__poster[data-visible="false"],
.works-dialog__poster[data-visible="false"] { opacity: 0; }
```

Do not alter grid, padding, radius, or aspect-ratio declarations.

- [ ] **Step 4: Verify GREEN and commit**

Run style tests; expect all to pass. Then:

```bash
git add src/styles.css src/styles.test.js
git commit -m "style: protect video transitions with poster layers"
```

---

### Task 6: Verify, Merge, Push, and Deploy

**Files:** verification only.

- [ ] **Step 1: Run full tests**

Run: `node node_modules/vitest/vitest.mjs run`

Expected: zero failed tests.

- [ ] **Step 2: Build and check diff**

Run `node node_modules/vite/bin/vite.js build`, then `git diff --check`.

Expected: build exit 0 and no diff-check output.

- [ ] **Step 3: Merge into main**

```bash
git switch main
git merge --ff-only feat/poster-protected-video
```

- [ ] **Step 4: Push GitHub**

Run: `git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin main`

Expected: remote main advances to local HEAD.

- [ ] **Step 5: Dry-run and deploy Vercel**

Run `pnpm dlx vercel@latest deploy --dry --format=json`; confirm `.worktrees` and all `public/media/works/*.mp4` files are excluded while all 14 `public/media/works/posters/*.webp` files are included. Then run `pnpm dlx vercel@latest --prod --yes`.

Expected: production reaches `READY` and aliases `https://aigcchen.cn`.

- [ ] **Step 6: Verify live state**

Compare `git rev-parse HEAD` with `git ls-remote origin refs/heads/main`, confirm a clean worktree, and make an HTTP HEAD request to `https://aigcchen.cn`.

Expected: hashes match and the domain returns HTTP 200 from Vercel.
