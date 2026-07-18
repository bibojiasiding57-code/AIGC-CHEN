# Hero Bottom Alignment Design

## Goal

Refine the Hero into a modern minimal bottom-aligned composition, bind the exact `日系风格测试.mp4` asset, keep the full `AIGC-CHEN·WELCOME` title on one line at every supported viewport, and remove the competing SCROLL pill.

## Asset binding

- Source keyword/basename: `日系风格测试`.
- Exact source match: `D:/视频/日系风格测试.mp4`.
- Existing synchronized public asset: `/media/works/japanese-style-test.mp4`.
- Replace the old `/media/hero-sunset.mp4` source with the synchronized asset.
- Remove the old `/media/hero-poster.jpg` poster because it does not visually match the new video.
- Update the video accessible label to `AIGC-CHEN 日系风格影像`.

## Content structure

Keep one ordered content stack:

1. `AI VISUAL DESIGNER / AIGC / CREATIVE DIRECTION`
2. `以数字媒体艺术为基础语言，将品牌视觉、AI 生成、影像合成与沉浸式体验融为一体。`
3. `AIGC-CHEN·WELCOME`

The `.hero__content` layer covers the Hero inset and becomes a vertical flex container with `justify-content: flex-end`. Horizontal and bottom padding control the safe edge distance. The three text elements move as one unit and keep their existing vertical order and spacing.

## Single-line title

- Preserve semantic `h1#hero-title`, its full accessible name, and SplitText character animation.
- Title text stays `AIGC-CHEN·WELCOME` with no line break or `wbr`.
- Remove the mobile SplitText break opportunity previously inserted after U+00B7.
- Use one responsive title size across desktop and mobile: `clamp(24px, 6.9vw, 130px)`.
- Keep `white-space: nowrap`, prevent flex shrink, and ensure the title width does not exceed the available content width at 360px, 390px, 1024px, 1440px, and the approximately 1700px page container.
- Retain the separator's subtle horizontal margin only when it does not cause overflow.

## Bottom alignment

- Desktop content padding: horizontal `clamp(28px, 5vw, 88px)`, bottom `clamp(14px, 1.6vw, 26px)`.
- Mobile content padding: horizontal `22px`, bottom `18px`.
- The title is the lowest visual element in the content stack.
- Remove the `.hero__scroll` element from App and delete its unused icon imports and styling.
- Brand bar remains at the top and is not part of the bottom content stack.

## Responsive behavior

- Desktop: large single-line title with the existing strong weight and tight tracking.
- 360px and 390px: single line, no `wbr`, no horizontal page overflow, no clipped characters.
- The kicker and introduction retain their relative order, but their spacing scales down on mobile.
- The background remains cover-fitted; desktop uses centered framing and mobile may use the existing right-biased object position if visual acceptance confirms it.

## Verification

- Component test: SplitText produces no `wbr[data-split-break]`.
- App test: Hero video source and label match the Japanese-style asset; no SCROLL link exists; the title remains the accessible h1.
- Stylesheet test: Hero content uses full-inset vertical flex with `justify-content: flex-end`; title uses the exact responsive clamp and nowrap; mobile override remains nowrap.
- Full test suite and Vite production build pass.
- Browser acceptance at 1440px, 1024px, 390px, and 360px verifies video binding, text order, bottom positioning, one title line, `scrollWidth <= clientWidth`, and zero horizontal document overflow.

## Out of scope

- Changing the Hero copy, logo, brand bar, border radius, navigation, or SplitText animation timing.
- Generating a new poster image.
- Changing other page sections.
