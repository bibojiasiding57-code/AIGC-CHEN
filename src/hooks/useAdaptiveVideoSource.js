import { useCallback, useEffect, useRef, useState } from "react";

export default function useAdaptiveVideoSource({
  source,
  mediaRef,
  enabled = true,
  releaseDelay = 20_000,
}) {
  const containerRef = useRef(null);
  const releaseTimerRef = useRef(null);
  const [activeSource, setActiveSource] = useState(undefined);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);

  const clearReleaseTimer = useCallback(() => {
    if (releaseTimerRef.current === null) return;
    clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = null;
  }, []);

  const requestSource = useCallback(() => {
    if (!enabled || !source) return;
    clearReleaseTimer();
    const media = mediaRef.current;
    if (media && media.getAttribute("src") !== source) {
      media.setAttribute("src", source);
      media.load();
    }
    setActiveSource(source);
  }, [clearReleaseTimer, enabled, mediaRef, source]);

  const releaseSource = useCallback(() => {
    clearReleaseTimer();
    const media = mediaRef.current;
    if (media) {
      media.pause();
      try {
        media.currentTime = 0;
      } catch {
        // The media may not have loaded enough data to seek.
      }
      media.removeAttribute("src");
      media.load();
    }
    setActiveSource(undefined);
  }, [clearReleaseTimer, mediaRef]);

  useEffect(() => {
    if (!enabled) {
      releaseSource();
      return undefined;
    }

    const container = containerRef.current;
    if (!container) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      setIsInViewport(true);
      return () => clearReleaseTimer();
    }

    const nearObserver = new IntersectionObserver(
      (entries) => {
        const isNear = entries.some((entry) => entry.isIntersecting);
        setIsNearViewport(isNear);
        if (isNear) {
          clearReleaseTimer();
          return;
        }
        clearReleaseTimer();
        releaseTimerRef.current = setTimeout(releaseSource, releaseDelay);
      },
      { rootMargin: "200px 0px" },
    );

    const activeObserver = new IntersectionObserver((entries) => {
      const isActive = entries.some((entry) => entry.isIntersecting);
      setIsInViewport(isActive);
      if (!isActive) mediaRef.current?.pause();
    });

    nearObserver.observe(container);
    activeObserver.observe(container);

    return () => {
      nearObserver.disconnect();
      activeObserver.disconnect();
      clearReleaseTimer();
    };
  }, [clearReleaseTimer, enabled, mediaRef, releaseDelay, releaseSource]);

  return {
    containerRef,
    activeSource,
    isNearViewport,
    isInViewport,
    requestSource,
    releaseSource,
  };
}
