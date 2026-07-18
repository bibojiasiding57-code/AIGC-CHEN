# Hero Bottom Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hero background with the exact Japanese-style video and turn the Hero copy into a bottom-aligned, single-line responsive composition.

**Architecture:** App owns the semantic Hero markup and exact media binding. SplitText remains responsible for character animation but no longer inserts a mobile break opportunity. CSS owns the full-inset flex stack, bottom safe area, and one fluid title scale shared across desktop and mobile.

**Tech Stack:** React 19, Vite 6, Vitest, Testing Library, GSAP SplitText, CSS Flexbox and fluid typography.

## Global Constraints

- Hero source is `/media/works/japanese-style-test.mp4`, matched from `D:/视频/日系风格测试.mp4`.
- Remove the old poster and SCROLL element.
- Keep text order: kicker, introduction, title.
- Title remains exactly `AIGC-CHEN·WELCOME`, semantic h1, accessible, and one line.
- Title font size is `clamp(24px, 6.9vw, 130px)`.
- Desktop and mobile use `white-space: nowrap`; no `wbr[data-split-break]` remains.
- Do not change Hero copy, brand bar, navigation, SplitText timing, or other page sections.
- Git is unavailable, so commit steps are omitted.

---

### Task 1: Hero media binding and SCROLL removal

**Files:**
- Modify: `src/App.test.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Produces Hero video DOM: `src=/media/works/japanese-style-test.mp4`, no poster, label `AIGC-CHEN 日系风格影像`.
- Removes `.hero__scroll` and unused `ArrowDown` / `MouseSimple` imports.

- [ ] **Step 1: Add failing App assertions**

```jsx
it("binds the Japanese-style Hero video and removes the scroll pill", () => {
  render(<App />);
  const video = screen.getByLabelText("AIGC-CHEN 日系风格影像");
  expect(video).toHaveAttribute("src", "/media/works/japanese-style-test.mp4");
  expect(video).not.toHaveAttribute("poster");
  expect(screen.queryByRole("link", { name: "SCROLL" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused RED**

Run `vitest run src/App.test.jsx -t "Japanese-style Hero"`. Expected: video label/source assertion fails and SCROLL still exists.

- [ ] **Step 3: Implement the exact App change**

Replace the Hero video source and label, delete `poster`, remove the SCROLL anchor, and remove only its now-unused icon imports.

- [ ] **Step 4: Run focused GREEN**

Expected: the new App test passes.

---

### Task 2: Remove SplitText break insertion

**Files:**
- Modify: `src/components/SplitText.test.jsx`
- Modify: `src/components/SplitText.jsx`

**Interfaces:**
- Preserves: `.split-char`, `.split-char--separator`, GSAP timing, cleanup, accessible h1.
- Removes: `wbr[data-split-break]` creation and duplicate guard.

- [ ] **Step 1: Replace the old WBR expectation with a failing no-break assertion**

```jsx
await waitFor(() => expect(animation.splitCalls).toHaveLength(1));
expect(document.querySelectorAll("wbr[data-split-break]")).toHaveLength(0);
expect(document.querySelector(".split-char--separator")).toHaveTextContent("·");
```

- [ ] **Step 2: Run focused RED**

Run the SplitText test matching `separator`. Expected: one WBR is still present.

- [ ] **Step 3: Remove only WBR insertion logic**

Keep separator class assignment, delete `existingBreak` lookup, `document.createElement("wbr")`, its data attribute, and `character.after(...)`.

- [ ] **Step 4: Run focused GREEN**

Expected: all SplitText tests pass.

---

### Task 3: Bottom-aligned flex layout and responsive single line

**Files:**
- Modify: `src/styles.test.js`
- Modify: `src/styles.css`

**Interfaces:**
- `.hero__content`: full inset, vertical flex, bottom justified.
- `.hero h1`: exact fluid clamp and nowrap at every viewport.

- [ ] **Step 1: Add failing stylesheet assertions**

Read `src/styles.css` and assert the base rules contain:

```css
.hero__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 clamp(28px, 5vw, 88px) clamp(14px, 1.6vw, 26px);
}
```

Assert `.hero h1` contains `font-size: clamp(24px, 6.9vw, 130px)` and `white-space: nowrap`, and the max-width 760px block also leaves `.hero__title.split-parent` at nowrap.

- [ ] **Step 2: Run focused RED**

Expected: old absolute left/right/bottom layout and old mobile wrapping rules fail.

- [ ] **Step 3: Implement base layout**

Convert `.hero__content` to the specified full-inset flex stack. Change the title clamp while preserving weight, line height, tracking, and uppercase styling. Delete all `.hero__scroll` CSS.

- [ ] **Step 4: Implement mobile overrides**

At max-width 760px, set `.hero__content { padding: 0 22px 18px; }`, remove the mobile title clamp override, and set `.hero h1` plus `.hero__title.split-parent` to `white-space: nowrap` with no `overflow-wrap:anywhere`.

- [ ] **Step 5: Run focused GREEN**

Expected: stylesheet and App/SplitText focused suites pass.

---

### Task 4: Final verification and browser acceptance

**Files:**
- Modify only when a verified defect is reproduced by a failing test.

**Interfaces:**
- Produces a final preview at `http://127.0.0.1:4173/`.

- [ ] **Step 1: Run full Vitest suite**

Expected: zero failures.

- [ ] **Step 2: Run Vite production build**

Expected: exit 0.

- [ ] **Step 3: Browser acceptance**

At 1440, 1024, 390, and 360px verify:

- Hero video source ends with `/media/works/japanese-style-test.mp4`.
- Kicker, introduction, and title keep the required DOM and visual order.
- Title has one line and no WBR.
- Title `scrollWidth <= clientWidth`; document `scrollWidth <= clientWidth`.
- Content bottom edge remains inside the Hero safe padding.
- No SCROLL link exists.

- [ ] **Step 4: Final self-review**

Check imports, removed selectors, unchanged animation timing, unchanged other sections, test evidence, and preview state.
