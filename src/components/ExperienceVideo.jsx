import { useCallback, useEffect, useRef } from "react";
import RevealMedia from "./RevealMedia";
import { useVideoBandwidthRegistration } from "../video/VideoBandwidthContext";

export default function ExperienceVideo({ id = "experience", src, poster, className = "", ariaLabel }) {
  const videoRef = useRef(null);
  useVideoBandwidthRegistration({ id, group: "idle", src, mediaRef: videoRef });

  const ensurePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || document.hidden || !video.hasAttribute("src")) return;
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
      muted
      loop
      playsInline
      webkit-playsinline="true"
      autoPlay
      preload="metadata"
      poster={poster}
      onCanPlay={ensurePlayback}
      aria-label={ariaLabel}
    />
  );
}
