# Works Gallery Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind the 14 supplied videos to the Works section in a fixed reading order, restore hover previews, and add double-click playback in an accessible large modal.

**Architecture:** A deterministic PowerShell sync script maps exact normalized source basenames to safe public filenames. `projects` remains the single ordered data source, `MediaCard` owns preview behavior and emits an open request, and a focused `WorksVideoDialog` owns modal playback and cleanup. App only coordinates the selected project.

**Tech Stack:** React 19, Vite 6, Vitest, Testing Library, native HTML `<video>` and `<dialog>`, CSS Grid, PowerShell asset sync.

## Global Constraints

- Render exactly 14 projects in the confirmed order; use `project.id` as the React key.
- Exact normalized basename matching takes precedence and must distinguish `vlog`, `vlog.mv`, and `mv.vlog`.
- Source folder is `D:/视频/`; public destination is `public/media/works/`.
- Hover/focus previews are muted and inline; leave/blur pauses and resets to zero.
- Double-click opens a native modal dialog; single click does not open it.
- Desktop is three columns, medium two columns, mobile one column.
- No external CDN, generated thumbnails, detail pages, or new package dependency.
- Git is unavailable in this environment, so commit steps are intentionally omitted.

---

### Task 1: Deterministic asset synchronization and project data

**Files:**
- Create: `scripts/sync-works-assets.ps1`
- Create: `src/data/portfolio.test.js`
- Modify: `src/data/portfolio.js`
- Create files under: `public/media/works/`

**Interfaces:**
- Produces: ordered `projects: Array<{id,title,category,year,type,src,tone}>`
- Produces: 14 public MP4 files with safe filenames.
- Consumes: exact files from `D:/视频/`.

- [ ] **Step 1: Write the failing data-order test**

```js
import { describe, expect, it } from "vitest";
import { projects } from "./portfolio";

const titles = [
  "啊维塔广告", "做着玩的", "fs21", "pv", "汽车广告", "测试成功",
  "好想回到那个时候", "日系风格测试", "风格测试", "仿真人短剧",
  "暗夜风格", "vlog.mv", "vlog", "mv.vlog",
];

describe("Works project data", () => {
  it("keeps all 14 projects in the confirmed reading order", () => {
    expect(projects.map(({ title }) => title)).toEqual(titles);
    expect(new Set(projects.map(({ id }) => id)).size).toBe(14);
    expect(projects.every(({ type }) => type === "video")).toBe(true);
  });

  it("keeps the vlog-like sources unambiguous", () => {
    expect(projects.slice(11).map(({ src }) => src)).toEqual([
      "/media/works/vlog-mv.mp4",
      "/media/works/vlog.mp4",
      "/media/works/mv-vlog.mp4",
    ]);
  });
});
```

- [ ] **Step 2: Run RED**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/data/portfolio.test.js
```

Expected: failure because the current array has 8 legacy projects.

- [ ] **Step 3: Create the exact-match sync script**

```powershell
param(
  [string]$Source = 'D:\视频',
  [string]$Destination = (Join-Path $PSScriptRoot '..\public\media\works')
)

$map = [ordered]@{
  '啊维塔广告' = 'avatr-ad.mp4'
  '做着玩的' = 'play-study.mp4'
  'fs21' = 'fs21.mp4'
  'pv' = 'pv.mp4'
  '汽车广告' = 'car-ad.mp4'
  '测试成功' = 'test-success.mp4'
  '好想回到那个时候' = 'back-to-that-time.mp4'
  '日系风格测试' = 'japanese-style-test.mp4'
  '风格测试' = 'style-test.mp4'
  '仿真人短剧' = 'realistic-short-drama.mp4'
  '暗夜风格' = 'dark-night-style.mp4'
  'vlog.mv' = 'vlog-mv.mp4'
  'vlog' = 'vlog.mp4'
  'mv.vlog' = 'mv-vlog.mp4'
}

$files = Get-ChildItem -LiteralPath $Source -File
$byBaseName = @{}
foreach ($file in $files) {
  $key = [IO.Path]::GetFileNameWithoutExtension($file.Name).Trim().ToLowerInvariant()
  if ($byBaseName.ContainsKey($key)) { throw "Ambiguous source basename: $key" }
  $byBaseName[$key] = $file
}

New-Item -ItemType Directory -Force -Path $Destination | Out-Null
foreach ($entry in $map.GetEnumerator()) {
  $key = $entry.Key.Trim().ToLowerInvariant()
  if (-not $byBaseName.ContainsKey($key)) { throw "Missing source video: $($entry.Key)" }
  $sourceFile = $byBaseName[$key]
  if ($sourceFile.Extension.ToLowerInvariant() -ne '.mp4') { throw "Expected MP4: $($sourceFile.Name)" }
  Copy-Item -LiteralPath $sourceFile.FullName -Destination (Join-Path $Destination $entry.Value) -Force
}

if ((Get-ChildItem -LiteralPath $Destination -Filter '*.mp4').Count -ne 14) {
  throw 'Destination must contain exactly 14 matched MP4 files.'
}
```

- [ ] **Step 4: Replace `projects` with the exact ordered array**

Use IDs and sources in the same order as the test, for example:

```js
export const projects = [
  { id: "avatr-ad", title: "啊维塔广告", category: "AI FILM / AUTOMOTIVE", year: "2026", type: "video", src: "/media/works/avatr-ad.mp4", tone: "amber" },
  { id: "play-study", title: "做着玩的", category: "AIGC / VISUAL STUDY", year: "2026", type: "video", src: "/media/works/play-study.mp4", tone: "cream" },
  { id: "fs21", title: "fs21", category: "AI FILM / EXPERIMENT", year: "2026", type: "video", src: "/media/works/fs21.mp4", tone: "pink" },
  { id: "pv", title: "pv", category: "PROMO VIDEO / MOTION", year: "2026", type: "video", src: "/media/works/pv.mp4", tone: "sky" },
  { id: "car-ad", title: "汽车广告", category: "BRAND FILM / AUTOMOTIVE", year: "2026", type: "video", src: "/media/works/car-ad.mp4", tone: "blue" },
  { id: "test-success", title: "测试成功", category: "AIGC / MOTION TEST", year: "2026", type: "video", src: "/media/works/test-success.mp4", tone: "red" },
  { id: "back-to-that-time", title: "好想回到那个时候", category: "AI FILM / MEMORY", year: "2026", type: "video", src: "/media/works/back-to-that-time.mp4", tone: "cream" },
  { id: "japanese-style-test", title: "日系风格测试", category: "STYLE STUDY / JAPAN", year: "2026", type: "video", src: "/media/works/japanese-style-test.mp4", tone: "denim" },
  { id: "style-test", title: "风格测试", category: "VISUAL TEST / AIGC", year: "2026", type: "video", src: "/media/works/style-test.mp4", tone: "amber" },
  { id: "realistic-short-drama", title: "仿真人短剧", category: "AI DRAMA / CHARACTER", year: "2026", type: "video", src: "/media/works/realistic-short-drama.mp4", tone: "night" },
  { id: "dark-night-style", title: "暗夜风格", category: "DARK STYLE / FILM", year: "2026", type: "video", src: "/media/works/dark-night-style.mp4", tone: "pink" },
  { id: "vlog-mv", title: "vlog.mv", category: "VLOG / MUSIC VIDEO", year: "2026", type: "video", src: "/media/works/vlog-mv.mp4", tone: "sky" },
  { id: "vlog", title: "vlog", category: "VLOG / DAILY FILM", year: "2026", type: "video", src: "/media/works/vlog.mp4", tone: "blue" },
  { id: "mv-vlog", title: "mv.vlog", category: "MUSIC VIDEO / VLOG", year: "2026", type: "video", src: "/media/works/mv-vlog.mp4", tone: "red" },
];
```

- [ ] **Step 5: Run sync and GREEN verification**

Run the sync script once, assert 14 destination files, then rerun the focused data test. Expected: 14 files and 2 passing tests.

---

### Task 2: Reliable card preview and explicit large-view control

**Files:**
- Create: `src/components/MediaCard.test.jsx`
- Modify: `src/components/MediaCard.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `project` from Task 1.
- Produces: `MediaCard({project,onOpen})`.
- Emits: `onOpen(project)` on visual double-click or large-view button activation.

- [ ] **Step 1: Write failing interaction tests**

Test that `pointerEnter` calls `play`, `pointerLeave` calls `pause` and sets `currentTime = 0`, double-click calls `onOpen(project)`, and the visible play affordance is a named button. Stub `HTMLMediaElement.prototype.play/pause` with Vitest.

- [ ] **Step 2: Run RED**

Expected: button query and `onOpen` assertions fail against the current decorative span.

- [ ] **Step 3: Implement preview cleanup and open behavior**

Add `resetPreview()`, use pointer handlers on `.media-card__visual`, and replace the decorative span with:

```jsx
<button
  className="media-card__play"
  type="button"
  aria-label={`大尺寸播放 ${project.title}`}
  onClick={(event) => {
    event.stopPropagation();
    resetPreview();
    onOpen?.(project);
  }}
>
  <Play weight="fill" aria-hidden="true" />
</button>
```

Attach `onDoubleClick={() => { resetPreview(); onOpen?.(project); }}` to the visual wrapper. Add an unmount cleanup effect that pauses the preview.

- [ ] **Step 4: Fix stacking and pointer behavior**

Set the video to local z-index 0 and `.media-card__play` to z-index 2, `pointer-events:auto`, `border:0`, and `cursor:pointer`. Preserve the existing visual appearance and add a visible focus ring.

- [ ] **Step 5: Run focused GREEN**

Expected: all MediaCard tests pass.

---

### Task 3: Native large-video dialog and App integration

**Files:**
- Create: `src/components/WorksVideoDialog.jsx`
- Create: `src/components/WorksVideoDialog.test.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `WorksVideoDialog({project,onClose})`.
- Consumes: selected project state from App.
- MediaCard receives: `onOpen={setSelectedProject}`.

- [ ] **Step 1: Write failing dialog and App tests**

Dialog tests must polyfill `showModal`/`close`, verify selected source/title, close button cleanup, native `close` event, and backdrop click. App tests must verify `14 PROJECTS / 2026`, 14 card titles in DOM order, and opening the dialog from the first card.

- [ ] **Step 2: Run RED**

Expected: missing dialog module, old `08 PROJECTS` counter, and missing modal.

- [ ] **Step 3: Implement `WorksVideoDialog`**

Use refs for dialog/video, call `showModal()` when a project exists, call `video.play()` safely, and centralize cleanup:

```js
const stopVideo = () => {
  const video = videoRef.current;
  if (!video) return;
  video.pause();
  video.currentTime = 0;
};
```

Render a close button, project metadata, and `<video controls autoPlay playsInline>`. On backdrop click, close only when `event.target === dialogRef.current`.

- [ ] **Step 4: Integrate in App**

Add `const [selectedProject, setSelectedProject] = useState(null)`, render all cards without featured layout:

```jsx
{projects.map((project) => (
  <MediaCard key={project.id} project={project} onOpen={setSelectedProject} />
))}
<WorksVideoDialog project={selectedProject} onClose={() => setSelectedProject(null)} />
```

Change the visible counter to `14 PROJECTS / 2026`.

- [ ] **Step 5: Add dialog styling**

Create a centered max-width player, dark translucent backdrop, responsive padding, 16:9 video surface, close button above the video, and mobile-safe viewport sizing. Ensure dialog stacking is above all page content.

- [ ] **Step 6: Run focused GREEN**

Expected: dialog, MediaCard, data, and App suites pass.

---

### Task 4: Final verification and browser acceptance

**Files:**
- Modify only if a verified defect is found.

**Interfaces:**
- Consumes the complete Works implementation.
- Produces a running production preview at `http://127.0.0.1:4173/`.

- [ ] **Step 1: Verify assets**

Check that the 14 expected destination filenames exist and that their file sizes are non-zero. Confirm no extra source was bound.

- [ ] **Step 2: Run the full test suite once**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run
```

Expected: every suite passes with zero failures.

- [ ] **Step 3: Build production output**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vite\bin\vite.js' build
```

Expected: exit 0.

- [ ] **Step 4: Browser acceptance**

At desktop, medium, and mobile widths verify card count/order and 3/2/1 columns. On desktop verify hover plays muted preview, pointer leave pauses and resets, double-click opens one modal player, controls work, Escape and close button stop playback, and no overlay blocks the button.

- [ ] **Step 5: Final independent review**

Review the data order, exact asset mapping, media lifecycle, dialog accessibility, CSS stacking, responsive reading order, and test evidence. Fix any Critical or Important finding before delivery.
