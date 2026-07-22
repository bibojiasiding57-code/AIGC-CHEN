# Global Video Bandwidth Mutex Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce modal-first and hover-second video bandwidth ownership by physically removing sources from every downgraded media element.

**Architecture:** A React context maintains a registry and a three-mode state machine. Reconciliation disconnects ineligible nodes before connecting the current owner group; components delegate all source assignment to this provider.

**Tech Stack:** React 18, Vite, Vitest, Testing Library

## Global Constraints

- Modal mode permits only the dialog source.
- Preview mode permits only the active project card source.
- Idle mode permits only Hero and Interactive Experience sources.
- Every downgrade executes pause, removeAttribute, empty src assignment, and load.
- The modal must expose native controls and render no custom loading overlay.

---

### Task 1: Video bandwidth manager

**Files:**
- Create: `src/video/VideoBandwidthContext.jsx`
- Test: `src/video/VideoBandwidthContext.test.jsx`

**Interfaces:**
- Produces: `VideoBandwidthProvider`, `useVideoBandwidthRegistration`, `useVideoBandwidthController`

- [ ] Write a failing integration test registering idle, preview, and modal videos and asserting exact `src` ownership across mode transitions.
- [ ] Run `pnpm vitest run src/video/VideoBandwidthContext.test.jsx` and confirm failure because the context does not exist.
- [ ] Implement the registry, synchronous disconnect-before-connect reconciliation, and controller methods `activatePreview`, `releasePreview`, `activateModal`, and `releaseModal`.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Integrate Hero, Interactive Experience, and MediaCard

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/ExperienceVideo.jsx`
- Modify: `src/components/MediaCard.jsx`
- Test: `src/components/ExperienceVideo.test.jsx`
- Test: `src/components/MediaCard.test.jsx`

**Interfaces:**
- Consumes: `useVideoBandwidthRegistration` and `useVideoBandwidthController`

- [ ] Add failing tests proving idle videos restore after preview release and inactive cards have no source.
- [ ] Run both focused test files and confirm the new assertions fail.
- [ ] Wrap the app with the provider, register Hero/Experience as idle owners, register each card as a preview owner, and remove `useAdaptiveVideoSource` usage from cards.
- [ ] Re-run the focused tests and confirm they pass.

### Task 3: Integrate modal-first playback

**Files:**
- Modify: `src/components/WorksVideoDialog.jsx`
- Test: `src/components/WorksVideoDialog.test.jsx`

**Interfaces:**
- Consumes: modal registration and `activateModal` / `releaseModal`

- [ ] Add failing tests asserting modal exclusivity, native controls, no `VideoLoadingOverlay`, and idle restoration on close.
- [ ] Run the dialog test and confirm the new assertions fail.
- [ ] Register the dialog video, acquire modal ownership before opening, release it on all close/unmount paths, and remove buffering-overlay state and markup.
- [ ] Re-run the dialog test and confirm it passes.

### Task 4: Verify and deploy

**Files:**
- Modify only files required by discovered regressions.

- [ ] Run `pnpm test -- --run` and require zero failures.
- [ ] Run `pnpm run build` and require exit code 0.
- [ ] Run `git diff --check` and inspect the final diff.
- [ ] Commit the implementation, push `main`, then verify the remote hash and `https://aigcchen.cn` production response.

