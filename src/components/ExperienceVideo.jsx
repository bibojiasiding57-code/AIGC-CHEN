import { useCallback, useEffect, useRef } from "react";
import RevealMedia from "./RevealMedia";

export default function ExperienceVideo({ src, className = "", ariaLabel }) {
  const videoRef = useRef(null);

  const ensurePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || document.hidden) return;
    video.muted = true;
    video.play()?.catch?.(() => {});
  }, []);

  useEffect(() => {
    ensurePlayback();
    document.addEventListener("visibilitychange", ensurePlayback);
    return () => document.removeEventListener("visibilitychange", ensurePlayback);
  }, [ensurePlayback]);

  return (
    <RevealMedia
      as="video"
      mediaRef={videoRef}
      className={className}
      src={src}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      onCanPlay={ensurePlayback}
      aria-label={ariaLabel}
    />
  );
}
