# Poster-Protected Video Playback Design

## Goal

Eliminate black frames and indefinite loading states while reducing concurrent video traffic. Preserve the existing Works card layout and interactions, keep the Interactive Experience video continuously alive, and give the selected modal video bandwidth priority.

## Root Causes

1. `MediaCard` accepts `project.poster`, but the 14 project records do not provide poster assets, so an unattached or not-yet-decoded video can expose a black frame.
2. The adaptive source hook currently prewarms sources near the viewport. With 14 large remote videos, scrolling can start several metadata or media requests without explicit user intent.
3. Loading state is driven by several media events, but there is no independent poster layer that stays visible until a decoded frame is ready or returns while playback stalls.
4. The Interactive Experience video is not currently using the card unloading hook, but it lacks an explicit permanent-source and playback-recovery contract.

## Asset Strategy

- Generate one WebP poster from an early representative frame of each of the 14 Works videos.
- Store posters under `public/media/works/posters/` using the project id as the stable filename.
- Bind every poster explicitly through `project.poster`; project order, ids, titles, categories, years, and video URLs remain unchanged.
- Posters are small deployable assets. Original large videos remain remote-hosted and excluded from the Vercel bundle.

## MediaCard Lifecycle

- Initial state: render the poster layer immediately, keep video `src` detached, and set `preload="metadata"`.
- IntersectionObserver may report viewport state but must not attach a card video source automatically.
- Hover, keyboard/focus playback intent, the play button, or double-click explicitly calls `requestSource()`.
- Poster remains above the video until `loadeddata` or `canplay` confirms a decoded/playable frame.
- `playing` also clears loading state. `waiting` and `stalled` restore the poster plus the buffering indicator so black frames never surface.
- Mouse leave pauses preview and resets it without opening the modal. Existing click/double-click behavior remains intact.
- When a card leaves the active viewport, playback pauses; delayed source release remains available to reclaim memory without immediate churn.

## Interactive Experience Contract

- The left Interactive Experience video is independent from `useAdaptiveVideoSource` and never participates in card source release.
- It always renders a valid `src` with `autoPlay`, `muted`, `loop`, and `playsInline`.
- It uses `preload="metadata"` and attempts muted playback on mount, on `canplay`, and when the document becomes visible again.
- Playback promise rejection is handled without unhandled errors; browser autoplay restrictions remain respected.
- The two right-hand magazine cards, their placement, reveal behavior, and all Interactive Section styling remain unchanged.

## Modal Bandwidth Priority

- Opening a project dialog broadcasts a pause signal to card previews before attaching the selected source.
- The modal uses `preload="auto"`, `playsInline`, and an immediate direct source attachment because it represents explicit playback intent.
- Its poster remains visible until `loadeddata` or `canplay`; `waiting` and `stalled` restore the poster and buffering treatment.
- Closing the modal pauses, resets, removes the source, and releases the decoder.

## Loading Visual Rules

- Skeleton/Poster phase: show the project poster, with the existing subtle glass loading treatment only while an explicitly requested source is preparing.
- Buffering phase: keep the poster visible and show the compact buffering indicator.
- Ready phase: hide both poster overlay and Loading UI immediately on `canplay`, `loadeddata`, or `playing`.
- All overlays remain `pointer-events: none`; existing play and navigation controls retain their z-index and event handlers.

## Testing

- Data tests require a unique WebP poster for all 14 projects.
- MediaCard tests prove: no initial `src`, `preload="metadata"`, poster protection before readiness, no automatic source attachment on observer entry, intent-driven loading, and immediate Loading dismissal on `canplay`.
- Interactive tests prove permanent source and autoplay attributes plus visibility/canplay playback recovery.
- Dialog tests prove poster protection, bandwidth-priority pause signaling, readiness transitions, and teardown.
- Run all Vitest suites, Vite production build, and `git diff --check` before merge/push.

## Deployment

- Commit implementation directly through the approved branch workflow, merge to `main`, push GitHub, deploy production with Vercel CLI, and verify `https://aigcchen.cn` returns HTTP 200.
- Keep `.vercelignore` exclusions for large Works videos and local worktrees.
