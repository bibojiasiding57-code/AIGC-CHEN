# Interactive Experience Video and Copy Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Interactive Experience left video with the existing “测试成功” asset and moderately shrink/lower its text block while preserving the two right-side magazine cards exactly.

**Architecture:** Keep the current `RevealMedia` composition and experience-stage layout. Change only the left video props in `App.jsx` and the `.experience-stage__copy` desktop/mobile declarations in `styles.css`. Protect the right-side cards with explicit component assertions and pre/post browser bounding-box comparisons.

**Tech Stack:** React 19, Vite 6, Vitest 3, Testing Library, CSS responsive positioning.

## Global Constraints

- Bind the left video to `/media/works/test-success.mp4` by the already matched “测试成功” filename.
- Remove the unrelated old poster and set the accessible name to `测试成功动态影像`.
- Preserve `muted`, `loop`, `playsInline`, `autoPlay`, and `preload="metadata"`.
- Do not modify the two right-side magazine cards’ JSX, asset paths, classes, positions, sizes, transforms, z-index, or reveal behavior.
- Do not modify the mood switcher, LaserFlow, experience-stage background, or overall stage structure.
- Desktop copy: `bottom: 6%`; heading `font-size: clamp(36px, 4.7vw, 76px)`.
- Mobile copy at `max-width: 760px`: `margin-top: 24px`; heading `font-size: clamp(32px, 10vw, 50px)`.
- At 1440×900, 390×844, and 360×800, copy must not overlap itself, leave the stage, or create document-level horizontal overflow.
- No dependencies, network access, or generated assets.
- This directory is not a Git repository, so commit steps are intentionally omitted.

---

### Task 1: Replace the left video while locking the right cards

**Files:**
- Modify: `src/App.test.jsx`
- Modify: `src/App.jsx:346-371`

**Interfaces:**
- Consumes: existing `RevealMedia` props and `/media/works/test-success.mp4` already used by the Works data.
- Produces: one left experience video labelled `测试成功动态影像`, plus unchanged fashion and cyber image cards.

- [ ] **Step 1: Add a failing component test**

Add inside `describe("AIGC-CHEN portfolio", ...)`:

```jsx
it("binds the test-success experience video and preserves the right magazine cards", () => {
  render(<App />);

  const video = screen.getByLabelText("测试成功动态影像");
  expect(video).toHaveAttribute("src", "/media/works/test-success.mp4");
  expect(video).not.toHaveAttribute("poster");
  expect(video).toHaveAttribute("preload", "metadata");

  expect(screen.getByAltText("红黑时尚编辑视觉")).toHaveAttribute(
    "src",
    "/media/fashion-editorial.jpg",
  );
  expect(screen.getByAltText("赛博角色编辑视觉")).toHaveAttribute(
    "src",
    "/media/cyber-editorial.jpg",
  );
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/App.test.jsx --maxWorkers=1 --minWorkers=1
```

Expected: FAIL because no element currently has the accessible name `测试成功动态影像` and the left video still uses `/media/cloud-fantasy.mp4`.

- [ ] **Step 3: Change only the left video props**

Replace the current left video source, poster, and label with:

```jsx
<RevealMedia
  as="video"
  className="experience-media experience-media--video"
  src="/media/works/test-success.mp4"
  muted
  loop
  playsInline
  autoPlay
  preload="metadata"
  aria-label="测试成功动态影像"
/>
```

Do not edit the `experience-media--fashion` or `experience-media--cyber` blocks.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run the command from Step 2.

Expected: all `src/App.test.jsx` tests pass.

### Task 2: Moderately shrink and lower the copy block

**Files:**
- Modify: `src/styles.test.js`
- Modify: `src/styles.css:968-988, 1421-1430`

**Interfaces:**
- Consumes: existing `.experience-stage__copy` markup and the `max-width: 760px` breakpoint.
- Produces: exact desktop/mobile positioning and fluid heading sizes without touching media-card selectors.

- [ ] **Step 1: Add a failing stylesheet regression test**

Append:

```js
describe("Interactive Experience copy layout", () => {
  it("moderately lowers and shrinks the desktop copy", () => {
    expect(stylesheet).toMatch(
      /\.experience-stage__copy\s*\{[^}]*left:\s*7%;[^}]*bottom:\s*6%;/s,
    );
    expect(stylesheet).toMatch(
      /\.experience-stage__copy h3\s*\{[^}]*font-size:\s*clamp\(36px,\s*4\.7vw,\s*76px\);/s,
    );
  });

  it("keeps the mobile copy below the media without overflow pressure", () => {
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*760px\)[\s\S]*?\.experience-stage__copy\s*\{[^}]*margin-top:\s*24px;/,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*760px\)[\s\S]*?\.experience-stage__copy h3\s*\{[^}]*font-size:\s*clamp\(32px,\s*10vw,\s*50px\);/,
    );
  });
});
```

- [ ] **Step 2: Run the stylesheet test and confirm RED**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/styles.test.js --maxWorkers=1 --minWorkers=1
```

Expected: both new assertions fail against `bottom: 11%`, `clamp(40px, 5.4vw, 88px)`, `margin-top: 8px`, and `clamp(38px, 12vw, 58px)`.

- [ ] **Step 3: Apply the exact approved CSS values**

Update only these declarations:

```css
.experience-stage__copy {
  bottom: 6%;
}

.experience-stage__copy h3 {
  font-size: clamp(36px, 4.7vw, 76px);
}

@media (max-width: 760px) {
  .experience-stage__copy {
    margin-top: 24px;
  }

  .experience-stage__copy h3 {
    font-size: clamp(32px, 10vw, 50px);
  }
}
```

Keep every other property and all `.experience-media--fashion` / `.experience-media--cyber` rules byte-for-byte unchanged.

- [ ] **Step 4: Run the stylesheet test and confirm GREEN**

Run the command from Step 2.

Expected: all `src/styles.test.js` tests pass.

### Task 3: Verify the frozen right side and responsive layout

**Files:**
- Verify: `src/App.jsx`
- Verify: `src/styles.css`
- Verify: `public/media/works/test-success.mp4`

**Interfaces:**
- Consumes: Tasks 1–2 production changes.
- Produces: verified production bundle and a retained preview at `http://127.0.0.1:4173/#experience`.

- [ ] **Step 1: Capture right-side bounding-box baseline before the production change is previewed**

At 1440×900 in the current preview, evaluate `.experience-media--fashion` and `.experience-media--cyber` and record each element’s rounded `x`, `y`, `width`, `height`, `transform`, and `zIndex`. This baseline must be captured before reloading a build containing Tasks 1–2.

- [ ] **Step 2: Run the full test suite**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run --maxWorkers=1 --minWorkers=1
```

Expected: all tests pass.

- [ ] **Step 3: Build the production bundle**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vite\bin\vite.js' build
```

Expected: Vite succeeds. The existing lazy LaserFlow chunk-size warning is acceptable; new errors are not.

- [ ] **Step 4: Verify desktop layout and right-side invariance**

At 1440×900, reload `#experience` and confirm:

```text
experience video src = /media/works/test-success.mp4
experience video poster = null
fashion and cyber bounding-box/style records exactly equal the Step 1 baseline
copy child order = P → H3 → SPAN
copy children do not overlap
copy bounding box remains inside .experience-stage
document scrollWidth <= document clientWidth
```

- [ ] **Step 5: Verify 390px and 360px layouts**

At 390×844 and 360×800, confirm the copy children do not overlap, the copy stays inside `.experience-stage`, the title has no horizontal text overflow, and the document has no horizontal overflow. Do not change right-side media selectors to fix any mobile issue; if stage height alone is insufficient, increase only `.experience-stage` mobile `min-height` and add a failing style test first.

- [ ] **Step 6: Perform fresh completion verification**

Re-run the full test and build commands from Steps 2–3 after any browser-driven correction. Reset the temporary viewport override and keep one `#experience` preview tab as the deliverable.
