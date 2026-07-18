# Clean Character Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every colored block and color-tinting effect from the existing four-card role layout while preserving the original character images, role names, descriptions, search, and horizontal navigation.

**Architecture:** Keep the existing `characters` data and carousel/filter behavior intact. Remove the per-card color variable from the React markup, then convert each card into a two-part neutral surface: an untouched image region and a separate white caption region.

**Tech Stack:** React 19, Vite 6, CSS, Vitest, Testing Library.

## Global Constraints

- Keep the current four-card desktop layout, three-card medium layout, and horizontally scrollable mobile layout.
- Preserve role names, English discipline text, Chinese role titles, search filtering, and previous/next controls.
- Do not modify the hero, works, interactive experience, or contact sections.
- Use only local dependencies and the existing local preview; do not install packages or perform network checks.
- The workspace `.git` directory is empty, so do not initialize a repository or create commits.

---

### Task 1: Remove color dependencies from character cards

**Files:**
- Modify: `src/App.test.jsx`
- Modify: `src/App.jsx:194-213`
- Modify: `src/styles.css:446-526`

**Interfaces:**
- Consumes: the existing `characters` array and `.character-card`, `.character-card__image`, `.character-card__body` markup.
- Produces: character cards with no inline `--character-color` style and with neutral image/caption styling.

- [ ] **Step 1: Write the failing regression test**

Add this test to `src/App.test.jsx`:

```jsx
it("keeps role cards neutral while preserving their labels", () => {
  const { container } = render(<App />);
  const cards = [...container.querySelectorAll(".character-card")];

  expect(cards.length).toBeGreaterThanOrEqual(4);
  cards.slice(0, 4).forEach((card) => {
    expect(card).not.toHaveAttribute("style");
  });
  expect(screen.getByText("Vision Director")).toBeVisible();
  expect(screen.getByText("AI FILM / VISUAL SYSTEM")).toBeVisible();
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src\App.test.jsx
```

Expected: the new test fails because each `.character-card` currently has an inline `--character-color` style.

- [ ] **Step 3: Remove the inline color variable**

Change the character article in `src/App.jsx` to:

```jsx
<article className="character-card" key={character.id}>
```

Keep the existing image, discipline, name, and title elements unchanged.

- [ ] **Step 4: Replace colored card styling with neutral image and caption regions**

Replace the current character card color/overlay rules in `src/styles.css` with:

```css
.character-card {
  position: relative;
  display: flex;
  flex: 0 0 calc((100% - clamp(42px, 4.5vw, 72px)) / 4);
  flex-direction: column;
  min-width: 230px;
  height: clamp(390px, 30vw, 490px);
  border: 1px solid rgba(37, 42, 50, 0.09);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.98);
  overflow: hidden;
  scroll-snap-align: start;
}

.character-card__image {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: #f8f6f2;
  pointer-events: none;
}

.character-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: none;
  transition: transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.character-card__body {
  position: relative;
  flex: 0 0 auto;
  min-height: 108px;
  padding: 17px clamp(18px, 1.5vw, 26px) 20px;
  border-top: 1px solid rgba(37, 42, 50, 0.08);
  color: var(--ink);
  background: rgba(255, 255, 255, 0.98);
  text-shadow: none;
}

.character-card__body p {
  margin: 0 0 7px;
  color: rgba(37, 42, 50, 0.52);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.character-card__body h3 {
  margin: 0 0 4px;
  color: var(--ink);
  font-size: clamp(22px, 1.7vw, 30px);
  line-height: 1;
  letter-spacing: -0.045em;
}

.character-card__body span {
  color: rgba(37, 42, 50, 0.62);
  font-size: 12px;
}
```

Delete the old `.character-card::before` rule and remove `mix-blend-mode` from the image region.

- [ ] **Step 5: Run the focused test and the full suite**

Run:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src\App.test.jsx
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run
```

Expected: all tests pass with no test warnings or errors.

---

### Task 2: Verify the rendered role section

**Files:**
- Inspect: `src/App.jsx`
- Inspect: `src/styles.css`
- Inspect: local preview at `http://127.0.0.1:4173/#about`

**Interfaces:**
- Consumes: the neutral card styling produced by Task 1.
- Produces: a visually checked desktop and mobile role section with working navigation.

- [ ] **Step 1: Check desktop rendering**

Open the role section in the existing local preview and confirm:

```text
Four cards are visible at desktop width.
Every character uses the original source colors.
No red, blue, green, gradient, or tinted block remains.
Names and descriptions sit on white caption bands.
```

- [ ] **Step 2: Check the next control**

Record `.character-track.scrollLeft`, activate the unique button named `下一组角色`, then confirm `scrollLeft` increases.

- [ ] **Step 3: Check the mobile breakpoint**

At a 390px viewport, confirm one main card remains readable, horizontal scrolling is available, and no name or description is clipped.

- [ ] **Step 4: Check browser errors**

Inspect page console errors and expect an empty result.

- [ ] **Step 5: Keep the preview available**

Leave the successful local preview open at `http://127.0.0.1:4173/#about` for user review.
