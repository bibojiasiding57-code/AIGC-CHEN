# Works Gallery Expansion Design

## Goal

Expand the Works section from 8 placeholders to 14 real video projects, preserve deterministic top-to-bottom and left-to-right ordering, restore hover previews, and provide double-click playback in a large accessible modal.

## Confirmed source order

The `projects` array and rendered DOM order must be exactly:

1. 啊维塔广告 — `啊维塔广告.mp4`
2. 做着玩的 — `做着玩的.mp4`
3. fs21 — `fs21.mp4`
4. pv — `pv.mp4`
5. 汽车广告 — `汽车广告.mp4`
6. 测试成功 — `测试成功.mp4`
7. 好想回到那个时候 — `好想回到那个时候.mp4`
8. 日系风格测试 — `日系风格测试.mp4`
9. 风格测试 — `风格测试.mp4`
10. 仿真人短剧 — `仿真人短剧.mp4`
11. 暗夜风格 — `暗夜风格.mp4`
12. vlog.mv — `vlog.mv.mp4`
13. vlog — `vlog.mp4`
14. mv.vlog — `mv.vlog.mp4`

Each item uses a stable semantic `id`; React keys use `project.id`, never the array index. Asynchronous media loading cannot reorder the DOM.

## Asset matching and placement

At implementation time, enumerate `D:/视频/` once and normalize each basename by lowercasing, trimming, and removing the final extension only. Match exact normalized basenames before considering partial keywords. This prevents `vlog`, `vlog.mv`, and `mv.vlog` from colliding.

Copy the 14 matched videos into `public/media/works/` using safe ASCII filenames. The runtime data source references those local public URLs. If a matching image with the same normalized basename exists, bind it as `poster`; otherwise omit `poster` and let the browser show the video's first decodable frame. Missing or ambiguous matches fail verification instead of silently binding the wrong file.

## Components and interaction

### MediaCard

- The full visual area is the preview target.
- Pointer enter or keyboard focus calls `video.play()` with muted inline playback.
- Pointer leave or blur pauses and resets `currentTime` to `0`.
- The visible play affordance is a real button above the video layer with explicit `z-index` and enabled pointer events.
- Double-clicking the card visual or activating the dedicated large-view control calls `onOpen(project)`.
- Single clicks do not open the modal, preventing accidental interruption of hover preview.

### WorksVideoDialog

Use native `<dialog>` for focus containment, Escape handling, and modal semantics.

- Open with `showModal()` after selecting the project.
- Render one large video with native controls, autoplay, and `playsInline`.
- Close through the close button, Escape, or a click on the dialog backdrop.
- On close, pause the large player, reset it, clear the selected project, and return focus naturally.
- Opening the dialog pauses/resets the card preview so two copies do not play simultaneously.

## Layout

- Desktop: three equal columns.
- Medium screens: two columns.
- Mobile: one column.
- All 14 cards use equal grid participation; remove featured spans that could make visual reading order ambiguous.
- Keep existing card styling, spacing, hover lift, and responsive breakpoints.
- Update the Works counter to `14 PROJECTS / 2026`.

## Error handling

- A card falls back to the existing branded placeholder if its video cannot load.
- Rejected `play()` promises are handled without unhandled console errors.
- A dialog cannot open without a selected, matched project.
- Closing or unmounting always pauses both preview and modal media.

## Verification

- Data test: exactly 14 entries in the required title/source order with unique IDs.
- Asset test/script: all 14 local URLs exist and the three vlog-like names map exactly.
- Component tests: hover/focus preview, leave/blur pause and reset, double-click open, real button click, and failed playback handling.
- Dialog tests: open, close button, Escape/native close event, backdrop close, and media cleanup.
- App test: `14 PROJECTS / 2026`, 14 cards, DOM order unchanged.
- Browser acceptance: desktop 3-column reading order, medium 2-column, mobile 1-column, hover preview, pointer removal reset, double-click large playback, and no blocking overlay.

## Out of scope

- Custom thumbnails generated from video frames.
- Per-project detail pages or written case studies.
- Uploading or hosting the large video files on an external CDN.
