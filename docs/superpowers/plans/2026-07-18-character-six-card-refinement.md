# Character Six-Card Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update all six Character cards with the approved three-level copy, bind the supplied black-dress and white-dress images to cards 5 and 6, and keep image density and responsive card geometry consistent.

**Architecture:** Keep the existing `characters` data model and `App.jsx` rendering loop as the single source of truth. Copy the two supplied images into a stable public asset directory, update only the six data records, and use per-record `object-position` values inside the existing shared `object-fit: cover` image contract. Add narrow regression tests for data order, DOM hierarchy, asset paths, and shared responsive styling.

**Tech Stack:** React 19, Vite 6, Vitest 3, Testing Library, CSS Flexbox and scroll snap.

## Global Constraints

- Keep the existing horizontal Character track, search, previous/next controls, and scroll-snap behavior.
- Keep the exact three-level order: AllCaps `discipline`, MixedCase `name`, Chinese `title`.
- Cards 1–6 must render in the approved left-to-right order with stable IDs and no asynchronous sorting.
- Cards 1–4 keep their current image files; cards 5–6 use the two supplied local PNG files.
- All six cards share one card height, one image-container geometry, and `object-fit: cover`.
- Cards 5–6 prioritize the same face/body visual density as cards 1–4, not full-body preservation.
- 360px and 390px layouts must have no document-level horizontal overflow or text overlap.
- Do not add dependencies or network access.
- This directory is not a Git repository, so commit steps are intentionally omitted.

---

### Task 1: Bind the two supplied character assets and replace the six data records

**Files:**
- Create: `public/media/characters/midnight-elegance.png`
- Create: `public/media/characters/urban-vanguard.png`
- Modify: `src/data/portfolio.js:29-84`
- Test: `src/data/portfolio.test.js`

**Interfaces:**
- Consumes: the existing exported `characters: Array<{ id, name, title, discipline, image, position }>`.
- Produces: the same `characters` export with six records in approved order and local paths for cards 5–6.

- [ ] **Step 1: Add a failing six-card data regression test**

Update the import to include `characters` and add:

```js
const expectedCharacters = [
  ["neo-youth-icon", "YOUTH CULTURE / POP AESTHETICS", "Neo-Youth Icon", "新世代青春图鉴"],
  ["valkyrie-ascendant", "CINEMATIC FANTASY / GAME IP", "Valkyrie Ascendant", "史诗幻想女主角"],
  ["desert-maverick", "OUTDOOR LIFESTYLE / AUTOMOTIVE", "Desert Maverick", "旷野风尚探索者"],
  ["ethereal-muse", "BEAUTY & LUXURY / HIGH FASHION", "Ethereal Muse", "高定纯净美学"],
  ["midnight-elegance", "HIGH LUXURY / PRESTIGE BRAND", "Midnight Elegance", "黑金奢华美学形象"],
  ["urban-vanguard", "EDITORIAL / MODERN FASHION", "Urban Vanguard", "都会摩登风尚图鉴"],
];

describe("Character data", () => {
  it("keeps the approved six-card order and three-level copy", () => {
    expect(characters.map(({ id, discipline, name, title }) => [id, discipline, name, title]))
      .toEqual(expectedCharacters);
    expect(new Set(characters.map(({ id }) => id)).size).toBe(6);
  });

  it("binds the supplied images only to cards five and six", () => {
    expect(characters.slice(4).map(({ image }) => image)).toEqual([
      "/media/characters/midnight-elegance.png",
      "/media/characters/urban-vanguard.png",
    ]);
    expect(characters.every(({ position }) => /^\d+% \d+%$/.test(position))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the data test and confirm RED**

Run the local Vitest binary directly with the bundled Node executable:

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/data/portfolio.test.js
```

Expected: FAIL because the current character names, text, IDs, and final image paths differ.

- [ ] **Step 3: Copy the supplied images to stable public paths**

```powershell
New-Item -ItemType Directory -Force 'public\media\characters'
Copy-Item -LiteralPath 'D:\下载合集\generated_3afc6919-3d47-45ee-9075-b39eaa25c39b_mw0-1kw-1eja3 (1).png' -Destination 'public\media\characters\midnight-elegance.png'
Copy-Item -LiteralPath 'D:\下载合集\generated_8ab4c916-04a4-412f-8fe7-9f123763c016_mw0-1kw-1dufl.png' -Destination 'public\media\characters\urban-vanguard.png'
```

Verify both destination files have the same byte sizes as their sources.

- [ ] **Step 4: Replace the six `characters` records**

Use the approved IDs and copy exactly. Keep the existing image path and current `position` for cards 1–4. Set cards 5–6 to the new asset paths and initial portrait-density positions of `50% 22%`:

```js
{
  id: "midnight-elegance",
  name: "Midnight Elegance",
  title: "黑金奢华美学形象",
  discipline: "HIGH LUXURY / PRESTIGE BRAND",
  image: "/media/characters/midnight-elegance.png",
  position: "50% 22%",
},
{
  id: "urban-vanguard",
  name: "Urban Vanguard",
  title: "都会摩登风尚图鉴",
  discipline: "EDITORIAL / MODERN FASHION",
  image: "/media/characters/urban-vanguard.png",
  position: "50% 22%",
},
```

- [ ] **Step 5: Run the data test and confirm GREEN**

Run the command from Step 2.

Expected: all `src/data/portfolio.test.js` tests pass.

### Task 2: Lock the three-level DOM structure and uniform card styling

**Files:**
- Modify: `src/App.test.jsx:128-138`
- Modify: `src/styles.css:440-506, 1153-1156, 1307-1311` only if tests or browser evidence show an inconsistency
- Modify: `src/styles.test.js`

**Interfaces:**
- Consumes: the six `characters` records from Task 1 and the existing `.character-card` markup.
- Produces: six cards whose body child order is `p`, `h3`, `span`, with one shared image sizing rule across breakpoints.

- [ ] **Step 1: Replace the stale Character component test with a failing six-card hierarchy test**

```jsx
it("renders all six characters in order with the preserved three-level hierarchy", () => {
  const { container } = render(<App />);
  const cards = [...container.querySelectorAll(".character-card")];

  expect(cards).toHaveLength(6);
  expect(cards.map((card) => card.querySelector("h3")?.textContent)).toEqual([
    "Neo-Youth Icon",
    "Valkyrie Ascendant",
    "Desert Maverick",
    "Ethereal Muse",
    "Midnight Elegance",
    "Urban Vanguard",
  ]);
  cards.forEach((card) => {
    const body = card.querySelector(".character-card__body");
    expect([...body.children].map(({ tagName }) => tagName)).toEqual(["P", "H3", "SPAN"]);
    expect(card).not.toHaveAttribute("style");
  });
});
```

- [ ] **Step 2: Add a shared-geometry stylesheet test**

```js
it("uses one shared cover crop and stable Character card geometry", () => {
  expect(stylesheet).toMatch(/\.character-card\s*\{[^}]*height:\s*clamp\(390px,\s*30vw,\s*490px\);/s);
  expect(stylesheet).toMatch(/\.character-card__image img\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*cover;/s);
  expect(stylesheet).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.character-card\s*\{[^}]*height:\s*420px;/);
});
```

- [ ] **Step 3: Run the focused component and style tests**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run src/App.test.jsx src/styles.test.js
```

Expected: the stale text test fails until replaced; the geometry test should document the existing shared contract. If the markup and CSS already satisfy the new contract, make no production change.

- [ ] **Step 4: Add only the minimum responsive text safeguards if browser evidence requires them**

If long categories or names overflow at 360px/390px, add these scoped rules without changing the three-level order:

```css
.character-card__body p {
  min-height: 2.2em;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .character-card__body h3 {
    font-size: clamp(21px, 6.2vw, 26px);
  }
}
```

Do not add these rules if the browser measurement shows no overflow or vertical misalignment.

- [ ] **Step 5: Run the focused tests and confirm GREEN**

Run the command from Step 3.

Expected: all focused tests pass.

### Task 3: Production build and visual-density calibration

**Files:**
- Modify: `src/data/portfolio.js` only for evidence-based card 5–6 `position` adjustments
- Verify: `public/media/characters/midnight-elegance.png`
- Verify: `public/media/characters/urban-vanguard.png`

**Interfaces:**
- Consumes: the completed data and styling contracts from Tasks 1–2.
- Produces: a production build and verified local preview at `http://127.0.0.1:4173/#about`.

- [ ] **Step 1: Run the full test suite**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run
```

Expected: all tests pass.

- [ ] **Step 2: Build the production bundle**

```powershell
& 'C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vite\bin\vite.js' build
```

Expected: Vite build succeeds. The existing lazy LaserFlow chunk-size warning is acceptable; no new build errors are acceptable.

- [ ] **Step 3: Verify desktop layout in the local preview**

At 1440×900, inspect `#about` and measure all six `.character-card` elements in one browser evaluation. Confirm equal card height and equal `.character-card__image` height, exact title order, no text overlap, and no document-level horizontal overflow. Visually compare face height and body occupancy; if card 5 or 6 is too distant or too tightly cropped, adjust only its `position` value in increments of 2 percentage points and rebuild.

- [ ] **Step 4: Verify 390px and 360px mobile layouts**

At 390×844 and 360×800, confirm:

```text
document.documentElement.scrollWidth <= document.documentElement.clientWidth
each visible card body keeps P → H3 → SPAN order
no body child bounding rectangles overlap
card height is 420px
image uses object-fit: cover
```

Use horizontal scrolling to inspect cards 5 and 6 and confirm their subjects match the visual density of cards 1–4.

- [ ] **Step 5: Re-run full tests and build after any calibration**

Repeat Steps 1–2 if any `position` or CSS value changed during visual calibration. Expected: all tests and the production build pass, then keep one preview tab as the deliverable.
