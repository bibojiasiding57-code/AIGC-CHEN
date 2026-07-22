# Global Video Bandwidth Mutex Design

## Goal

Prevent background media requests from competing with the video the visitor is actively watching. Video ownership is explicit and every downgrade physically disconnects the media element from its source.

## Priority model

The manager exposes three modes, ordered from highest to lowest priority:

1. `modal`: only the open dialog video may own a source.
2. `preview`: only the currently hovered or focused project card may own a source.
3. `idle`: the Hero and Interactive Experience videos may own sources and loop silently.

Opening a modal overrides a card preview. Closing the modal always returns directly to idle. Leaving a card returns to idle unless a modal is active.

## Architecture

`VideoBandwidthProvider` owns the current mode and a registry of video nodes. Each registration includes an id, group (`idle`, `preview`, or `modal`), source URL, and optional activation callback. A synchronous reconciliation pass disconnects every ineligible video before connecting eligible videos.

Disconnecting means calling `pause()`, `removeAttribute('src')`, assigning `video.src = ''`, and calling `video.load()`. Connecting means assigning the registered source, calling `load()`, and invoking muted playback for idle and preview owners. React components never retain an independent source lifecycle.

## Component behavior

- Hero registers as an idle owner and retains its existing autoplay, muted, loop, and playsInline behavior.
- Interactive Experience registers as an idle owner and retains its existing autoplay, muted, loop, and playsInline behavior.
- Media cards register as preview owners. Pointer/focus entry requests preview ownership; pointer/focus exit releases it. Posters remain visible while inactive.
- The works dialog registers as the modal owner. It requests modal ownership before playback and releases ownership during every close/unmount path.
- The dialog uses native controls and its poster. The custom loading overlay is not rendered in the dialog.

## Safety and testing

Tests assert source attributes rather than only `pause()` calls. Coverage includes idle dual playback, preview exclusivity, modal exclusivity, modal close restoration, preview leave restoration, and dialog native controls without the custom loading overlay. The full test suite and production build must pass before pushing `main`.

