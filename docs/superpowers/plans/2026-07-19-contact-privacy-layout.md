# Contact Privacy and Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public email, remove every telephone control, and rebalance the Contact section into a responsive two-action layout.

**Architecture:** Keep `contact.email` in the portfolio data module as the only contact value consumed by the React view. Remove phone rendering at the component boundary, then update the existing CSS grids without introducing new components or dependencies.

**Tech Stack:** React 19, Vite 6, CSS Grid, Vitest, Testing Library

## Global Constraints

- Canonical email is exactly `3845498804@qq.com`.
- Contact copy is exactly “致力于将前沿 AIGC 技术、数字影像美学与品牌深度叙事完美融合。如果你正在寻找商业视觉与品牌营销的全新解法，欢迎随时畅聊。”
- No visible phone number, phone icon, or `tel:` link may remain.
- Desktop contact actions use approximately `2fr 1fr`; 360px/390px layouts stack in one column.
- Preserve the established visual styling and existing clipboard success/failure feedback.

---

### Task 1: Lock contact data and behavior with tests

**Files:**
- Modify: `src/App.test.jsx`
- Modify: `src/data/portfolio.test.js`

**Interfaces:**
- Consumes: `contact.email` from `src/data/portfolio.js`
- Produces: regression coverage for rendered email, mail link, clipboard payload, exact description, and absence of telephone UI

- [ ] **Step 1: Add failing data and UI tests**

Add assertions equivalent to:

```jsx
expect(contact).toEqual({ email: "3845498804@qq.com" });

const { container } = render(<App />);
expect(screen.getAllByText("3845498804@qq.com").length).toBeGreaterThan(0);
expect(screen.getByRole("link", { name: /3845498804@qq.com/i })).toHaveAttribute(
  "href",
  "mailto:3845498804@qq.com",
);
expect(container.querySelector('a[href^="tel:"]')).not.toBeInTheDocument();
expect(screen.queryByText(/\+86/)).not.toBeInTheDocument();
expect(screen.getByText("致力于将前沿 AIGC 技术、数字影像美学与品牌深度叙事完美融合。如果你正在寻找商业视觉与品牌营销的全新解法，欢迎随时畅聊。")).toBeVisible();
```

For clipboard behavior, stub `navigator.clipboard.writeText`, click the existing “复制邮箱” button, and assert:

```jsx
expect(writeText).toHaveBeenCalledWith("3845498804@qq.com");
expect(await screen.findByText("邮箱已复制")).toBeVisible();
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `pnpm test --run src/App.test.jsx src/data/portfolio.test.js`

Expected: FAIL because the old email and telephone controls are still rendered.

---

### Task 2: Update contact data and React markup

**Files:**
- Modify: `src/data/portfolio.js:165`
- Modify: `src/App.jsx:1-15,194-210,393-420`

**Interfaces:**
- Consumes: the canonical `contact.email` value
- Produces: phone-free navigation and Contact markup with functional mail and clipboard actions

- [ ] **Step 1: Replace shared contact data**

Use exactly:

```js
export const contact = {
  email: "3845498804@qq.com",
};
```

- [ ] **Step 2: Remove telephone markup and update copy**

Remove `Phone` from the Phosphor import, delete `.pill-nav__phone`, and delete the Contact section telephone anchor. Replace the Contact paragraph with the exact Global Constraints copy. Retain:

```jsx
<a href={`mailto:${contact.email}`}>
  {/* existing email icon and labels */}
</a>
<button type="button" onClick={copyEmail}>
  {/* existing copy icon, label, and feedback */}
</button>
```

- [ ] **Step 3: Run focused tests**

Run: `pnpm test --run src/App.test.jsx src/data/portfolio.test.js`

Expected: PASS, including the clipboard payload and “邮箱已复制” feedback assertions.

---

### Task 3: Rebalance navigation and Contact grids

**Files:**
- Modify: `src/styles.css`
- Modify: `src/styles.test.js`

**Interfaces:**
- Consumes: two children in `.pill-nav` and two children in `.contact-actions`
- Produces: gap-free desktop grids and stacked mobile actions

- [ ] **Step 1: Add failing CSS regression assertions**

Read `src/styles.css` in the existing style test and assert it contains the new desktop declarations and no `.pill-nav__phone` selector:

```js
expect(css).toMatch(/\.pill-nav\s*{[^}]*grid-template-columns:\s*minmax\(520px,\s*1fr\)\s+auto/s);
expect(css).toMatch(/\.contact-actions\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*2fr\)\s+minmax\(220px,\s*1fr\)/s);
expect(css).not.toContain(".pill-nav__phone");
```

- [ ] **Step 2: Run the style test and confirm failure**

Run: `pnpm test --run src/styles.test.js`

Expected: FAIL against the old three-column grids and phone selector.

- [ ] **Step 3: Update responsive CSS**

Set the desktop navigation and Contact grids to:

```css
.pill-nav {
  grid-template-columns: minmax(520px, 1fr) auto;
}

.contact-actions {
  grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr);
}
```

Remove `.pill-nav__phone`-specific rules and its mobile hide rule. At the existing mobile breakpoint retain:

```css
.contact-actions {
  grid-template-columns: 1fr;
}

.contact-actions button {
  grid-column: auto;
}
```

Adjust the intermediate breakpoint so it keeps the same two-column proportion unless the available width requires the established single-column mobile rule.

- [ ] **Step 4: Run the style test**

Run: `pnpm test --run src/styles.test.js`

Expected: PASS.

---

### Task 4: Full verification

**Files:**
- Verify: `src/App.jsx`
- Verify: `src/data/portfolio.js`
- Verify: `src/styles.css`

**Interfaces:**
- Consumes: completed data, markup, and CSS changes
- Produces: a tested production build

- [ ] **Step 1: Scan for obsolete contact values**

Run: `rg -n 'contact@aigc-chen|contact\.phone|tel:|pill-nav__phone|\+86 000' src`

Expected: no matches.

- [ ] **Step 2: Run the entire test suite**

Run: `pnpm test --run`

Expected: all tests pass.

- [ ] **Step 3: Build production assets**

Run: `pnpm build`

Expected: Vite completes successfully and writes `dist/`.

- [ ] **Step 4: Inspect responsive rendering**

Open the local preview and verify desktop plus 390px and 360px widths: the top navigation has no telephone capsule; Contact has no empty center slot; desktop uses the approved 2:1 visual ratio; mobile stacks without overflow; clicking the email opens the canonical `mailto:` target; clicking copy shows “邮箱已复制”.
