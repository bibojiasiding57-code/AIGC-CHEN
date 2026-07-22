# Native MP4 Vercel Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the HLS pilot with twelve size-validated fast-start MP4 files served from Vercel and a native-video bandwidth scheduler.

**Architecture:** Project cards remain poster-only until a modal opens. Idle Hero and Experience videos keep their existing sources and are paused, without source destruction, while the single modal video owns playback bandwidth.

**Tech Stack:** React 19, Vite 6, native HTML5 video, FFmpeg libx264/AAC, Vitest, Vercel static hosting.

## Global Constraints

- Delete `car-ad` and `realistic-short-drama`, including source MP4, WebP poster, and project data.
- Encode Avatr at CRF 17 with CRF 18 fallback; encode the other eleven at CRF 15 with CRF 16 fallback.
- Every encode uses `-preset slow -maxrate 5M -bufsize 10M -c:a aac -b:a 192k -movflags +faststart` and must be at most 95 MB.
- Put outputs in `public/videos/` and do not use HLS, hls.js, R2, or GitHub media URLs.
- Work cards must not carry a video `src` outside the open modal.
- Modal open pauses Hero and Experience without clearing either `src`; modal close resumes both.
- Keep poster images and native modal controls; do not add a custom loading overlay.

---

### Task 1: Encode and audit twelve MP4 assets

**Files:**
- Create: `scripts/encode-work-videos-crf15.ps1`
- Create: `public/videos/*.mp4`

- [ ] Write a deterministic PowerShell manifest mapping the twelve source names to output names and CRF fallback pairs.
- [ ] Run FFmpeg with the approved maxrate/bufsize command; retry once at the fallback CRF and fail if the result exceeds 95 MB.
- [ ] Record source/output byte sizes and verify `moov` fast-start-compatible output.

### Task 2: Replace HLS scheduling with native MP4 modal ownership

**Files:**
- Modify: `src/video/VideoBandwidthContext.jsx`
- Modify: `src/components/MediaCard.jsx`
- Modify: `src/components/WorksVideoDialog.jsx`
- Modify: `src/data/portfolio.js`
- Test: `src/video/VideoBandwidthContext.test.jsx`
- Test: `src/components/MediaCard.test.jsx`
- Test: `src/components/WorksVideoDialog.test.jsx`
- Delete: `src/video/HlsVideoAdapter.js`
- Delete: `src/video/HlsVideoAdapter.test.js`

- [ ] Write failing tests proving cards have no video source, modal open only pauses idle videos, and modal close resumes them.
- [ ] Implement the minimal native-video registry and modal ownership transition.
- [ ] Point all twelve data records to `/videos/*.mp4`, remove the two deleted records, and remove HLS properties.

### Task 3: Remove pilot infrastructure and deploy production

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`, `.gitattributes`, `.vercelignore`, `vercel.json`
- Delete: `public/media/hls/`, `scripts/create-lossless-hls.ps1`, `scripts/upload-hls-to-r2.ps1`, `config/r2-cors.json`, `docs/r2-hls-deployment.md`

- [ ] Remove hls.js and every HLS/R2/GitHub media reference.
- [ ] Run the full Vitest suite and Vite production build.
- [ ] Merge the production-ready result into `main`, push GitHub, and deploy Vercel production.
