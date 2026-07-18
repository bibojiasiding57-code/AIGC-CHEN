# AIGC-CHEN Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive React + Vite portfolio for AI designer AIGC-CHEN that faithfully adapts the supplied warm-orange editorial reference and uses the user's real media.

**Architecture:** A single-page React app renders five semantic sections from a small portfolio data module. Pure UI helpers are tested independently, reusable media and heading components keep rendering focused, and one stylesheet owns tokens, responsive layout, and motion.

**Tech Stack:** React 19.2, Vite 6.4, Vitest, Testing Library, CSS, supplied MP4/PNG media.

## Global Constraints

- Use React + Vite and keep the site local and runnable.
- Match the reference image's warm orange canvas, large rounded hero, bold white typography, teal pill navigation, cream project cards, and editorial spacing.
- Site name is `AIGC-CHEN`; identity is `AI 设计师`.
- Required sections are `角色介绍`, `作品案例`, `互动体验`, and `联系方式`.
- Desktop content width is approximately `1700px`; mobile must not horizontally overflow at `390px`.
- Use supplied real images and videos; no placeholder artwork, custom SVG art, emoji art, or invented logos.
- Hero video is muted, looping, inline, and has a static poster fallback.
- Respect `prefers-reduced-motion`.

---

### Task 1: Project foundation and pure UI behavior

**Files:**
- Create: `package.json`
- Create: `vite.config.mjs`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/utils/ui.test.js`
- Create: `src/utils/ui.js`

**Interfaces:**
- Produces: `getSectionId(href: string): string` and `getCopyFeedback(copied: boolean, failed: boolean): string`.

- [ ] **Step 1: Create the project manifest and Vitest setup**

Use React `19.2.0`, React DOM `19.2.0`, Vite `6.4.2`, `@vitejs/plugin-react` `5.0.4`, Vitest, jsdom, and Testing Library. Scripts must be `dev`, `build`, `preview`, and `test`.

- [ ] **Step 2: Write the failing helper tests**

```js
import { describe, expect, it } from "vitest";
import { getCopyFeedback, getSectionId } from "./ui";

describe("getSectionId", () => {
  it("removes the hash from an internal section link", () => {
    expect(getSectionId("#works")).toBe("works");
  });
});

describe("getCopyFeedback", () => {
  it("returns manual copy guidance after a clipboard failure", () => {
    expect(getCopyFeedback(false, true)).toBe("请手动复制邮箱");
  });
});
```

- [ ] **Step 3: Run the helper test and verify RED**

Run: `pnpm test -- src/utils/ui.test.js --run`

Expected: FAIL because `src/utils/ui.js` does not exist.

- [ ] **Step 4: Implement the pure helpers**

```js
export const getSectionId = (href) => href.replace(/^#/, "");

export const getCopyFeedback = (copied, failed) => {
  if (failed) return "请手动复制邮箱";
  if (copied) return "邮箱已复制";
  return "复制邮箱";
};
```

- [ ] **Step 5: Run the helper test and verify GREEN**

Run: `pnpm test -- src/utils/ui.test.js --run`

Expected: 2 tests pass.

### Task 2: Portfolio data, media, and semantic page structure

**Files:**
- Create: `public/media/*`
- Create: `src/data/portfolio.js`
- Create: `src/components/SectionHeading.jsx`
- Create: `src/components/MediaCard.jsx`
- Create: `src/App.test.jsx`
- Create: `src/App.jsx`

**Interfaces:**
- Consumes: `getSectionId` and `getCopyFeedback` from `src/utils/ui.js`.
- Produces: default React component `App` and data arrays `navItems`, `capabilities`, `projects`.

- [ ] **Step 1: Write the failing page behavior tests**

```jsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("AIGC-CHEN portfolio", () => {
  it("renders the required portfolio sections", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "角色介绍" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "作品案例" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "互动体验" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "联系方式" })).toBeTruthy();
  });

  it("switches the interactive mood", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "柔光" }));
    expect(screen.getByTestId("experience-stage").dataset.mood).toBe("soft");
  });
});
```

- [ ] **Step 2: Run the page test and verify RED**

Run: `pnpm test -- src/App.test.jsx --run`

Expected: FAIL because `src/App.jsx` does not exist.

- [ ] **Step 3: Copy curated supplied media into `public/media`**

Copy one lightweight MP4 for Hero, four MP4 case studies, and six PNG posters. Use stable English filenames and keep the original files unchanged.

- [ ] **Step 4: Implement page data and components**

`portfolio.js` must define four navigation items, three capabilities, at least six projects, and contact details. `MediaCard` must render `<video>` when `type === "video"` and `<img>` otherwise, with accessible labels and a text fallback.

- [ ] **Step 5: Implement the five-section App**

Add semantic headings, internal anchor navigation, mood buttons `沉浸`, `柔光`, `脉冲`, and the email-copy interaction. Do not create additional routes or backend features.

- [ ] **Step 6: Run the page test and verify GREEN**

Run: `pnpm test -- src/App.test.jsx --run`

Expected: 2 tests pass.

### Task 3: Reference-matched styling and responsive behavior

**Files:**
- Create: `src/styles.css`
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`
- Test: `src/App.test.jsx`

**Interfaces:**
- Consumes the semantic class names and data attributes from `App.jsx`.
- Produces the reference-matched desktop and mobile visual system.

- [ ] **Step 1: Add a failing accessibility-state test**

```jsx
it("marks the selected mood button as pressed", () => {
  render(<App />);
  const button = screen.getByRole("button", { name: "脉冲" });
  fireEvent.click(button);
  expect(button.getAttribute("aria-pressed")).toBe("true");
});
```

- [ ] **Step 2: Run the page test and verify RED**

Run: `pnpm test -- src/App.test.jsx --run`

Expected: FAIL because selected state is not exposed through `aria-pressed`.

- [ ] **Step 3: Implement selected-state semantics and complete CSS**

Use design tokens for `#F6A04D`, `#FFF6EA`, `#252A32`, and `#397782`; a rounded large Hero; pill navigation; cream project cards; fluid typography; `1100px` and `720px` breakpoints; focus-visible styles; and reduced-motion overrides.

- [ ] **Step 4: Run all tests and verify GREEN**

Run: `pnpm test -- --run`

Expected: all tests pass with no unhandled errors.

### Task 4: Build, browser verification, and design QA

**Files:**
- Create: `design-qa.md`
- Modify: implementation files only when QA finds P0/P1/P2 issues.

**Interfaces:**
- Consumes: reference image and running Vite app.
- Produces: browser-tested local preview and `design-qa.md` with `final result: passed`.

- [ ] **Step 1: Run the production build**

Run: `pnpm build`

Expected: Vite exits with code 0 and writes `dist/`.

- [ ] **Step 2: Start the local preview**

Run: `pnpm dev -- --host 0.0.0.0 --port 4173 --strictPort`

Expected: local app is available at port `4173`.

- [ ] **Step 3: Verify desktop and mobile in the in-app browser**

At `1440 × 1024`, test all four navigation links, all three mood controls, and the email action; inspect console errors. At `390 × 844`, verify no horizontal overflow and no clipped primary content.

- [ ] **Step 4: Compare reference and implementation**

Capture the implementation at `1440 × 1024`, combine it side-by-side with the reference image, and inspect typography, spacing, colors, media crop, and copy. Record findings in `design-qa.md`.

- [ ] **Step 5: Fix and repeat until pass**

Fix every P0/P1/P2 finding, recapture at the same viewport, and repeat the comparison until `design-qa.md` ends with exactly `final result: passed`.

- [ ] **Step 6: Run final verification**

Run: `pnpm test -- --run` and `pnpm build`.

Expected: all tests pass and build exits with code 0.
