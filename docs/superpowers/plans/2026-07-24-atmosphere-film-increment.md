# Atmosphere Film Increment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add “氛围短片” as the second work card, producing one optimized native MP4 and one WebP poster without changing existing layout or player behavior.

**Architecture:** Reuse the existing `projects` array, `MediaCard`, and `WorksVideoDialog` contracts. The card remains poster-only with no `src`; the existing dialog receives `/videos/atmosphere-film.mp4` through the unchanged `data-video-src` flow.

**Tech Stack:** React 19, Vite 6, Vitest, FFmpeg/libx264, WebP.

## Global Constraints

- Insert “氛围短片” immediately after “啊维塔广告”.
- Use category `AI FILM / ATMOSPHERE`, year `2026`, and the existing card visual system.
- Encode H.264 CRF 15, preset slow, maxrate 5M, bufsize 10M, AAC 192k, faststart.
- If output exceeds 95MB, retry at CRF 16.
- Extract the WebP poster at 2 seconds, quality 85, preserving source aspect ratio.
- Do not modify player, bandwidth ownership, hover, viewport, or grid CSS logic.

---

### Task 1: Lock the 13-item data contract

**Files:**
- Modify: `src/data/portfolio.test.js`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Consumes: existing `projects` export and rendered `.project-grid`.
- Produces: failing assertions for the new order, count, labels, and paths.

- [ ] **Step 1: Write failing tests**

Add “氛围短片” after “啊维塔广告”, expect 13 projects/cards, and expect `13 PROJECTS / 2026`.

- [ ] **Step 2: Verify RED**

Run the two test files and confirm failures report the missing title and old count of 12.

- [ ] **Step 3: Add the minimal data and counter update**

Insert:

```js
{
  id: "atmosphere-film",
  title: "氛围短片",
  category: "AI FILM / ATMOSPHERE",
  year: "2026",
  type: "video",
  src: resolveVideoSrc("/videos/atmosphere-film.mp4"),
  poster: "/media/works/posters/atmosphere-film.webp",
  tone: "cream",
}
```

Change only the displayed counter from 12 to 13.

- [ ] **Step 4: Verify GREEN**

Run the same tests and confirm they pass.

### Task 2: Produce the optimized media pair

**Files:**
- Create: `public/videos/atmosphere-film.mp4`
- Create: `public/media/works/posters/atmosphere-film.webp`

**Interfaces:**
- Consumes: `D:\就是玩儿\氛围短片.mp4`.
- Produces: the exact URLs referenced by the project data.

- [ ] **Step 1: Encode at CRF 15**

Run FFmpeg with libx264, CRF 15, preset slow, maxrate 5M, bufsize 10M, AAC 192k, and faststart.

- [ ] **Step 2: Enforce the 95MB limit**

Measure the output. If it exceeds 95MB, delete only that output and encode again at CRF 16.

- [ ] **Step 3: Extract the poster**

Seek to 2 seconds and encode one WebP frame at quality 85 without resizing.

- [ ] **Step 4: Validate media**

Decode one frame from the MP4, verify H.264 codec metadata, verify the WebP dimensions, and verify output size is at most 95MB.

### Task 3: Verify and deploy

**Files:**
- Modify: no additional production files.

**Interfaces:**
- Consumes: the final 13-card app.
- Produces: tested `main` and a production deployment.

- [ ] **Step 1: Run all tests**

Run Vitest and require every test to pass.

- [ ] **Step 2: Build production**

Run Vite build and require exit code 0.

- [ ] **Step 3: Browser-check desktop and mobile**

Confirm the new card is second, cards remain source-free, the modal plays the new MP4, and no horizontal overflow appears.

- [ ] **Step 4: Commit and deploy**

Commit the incremental files, push `main`, deploy Vercel production, and verify `aigcchen.cn` plus an MP4 range request.
