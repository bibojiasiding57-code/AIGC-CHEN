import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play } from "@phosphor-icons/react";
import useAdaptiveVideoSource from "../hooks/useAdaptiveVideoSource";
import VideoLoadingOverlay from "./VideoLoadingOverlay";

export default function MediaCard({ project, featured = false, onOpen }) {
  const mediaRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const { containerRef, activeSource, requestSource } = useAdaptiveVideoSource({
    source: project.src,
    mediaRef,
    enabled: project.type === "video",
  });

  const playPreview = () => {
    if (project.type === "video") {
      const media = mediaRef.current;
      if (!media) return;
      requestSource();
      if (media.readyState < 3) setIsBuffering(true);
      media.play().catch(() => setIsBuffering(false));
    }
  };

  const resetPreview = () => {
    if (project.type === "video") {
      const media = mediaRef.current;
      if (!media) return;
      media.pause();
      media.currentTime = 0;
    }
  };

  useEffect(() => () => resetPreview(), [project.src]);

  useEffect(() => {
    const pauseForModal = () => resetPreview();
    window.addEventListener("aigcchen:modal-video-open", pauseForModal);
    return () => window.removeEventListener("aigcchen:modal-video-open", pauseForModal);
  }, [project.src]);

  useEffect(() => {
    if (activeSource) return;
    setHasFrame(false);
    setIsBuffering(false);
  }, [activeSource]);

  const openProject = () => {
    resetPreview();
    onOpen?.(project);
  };

  return (
    <article
      className={`media-card media-card--${project.tone}${featured ? " media-card--featured" : ""}`}
      data-reveal
    >
      <div className="media-card__topline">
        <span>{project.category}</span>
        <span>{project.year}</span>
      </div>

      <div
        ref={containerRef}
        className="media-card__visual"
        onPointerEnter={playPreview}
        onPointerLeave={resetPreview}
        onFocus={playPreview}
        onBlur={resetPreview}
        onDoubleClick={openProject}
      >
        {failed ? (
          <div className="media-card__fallback" role="img" aria-label={`${project.title} 媒体暂不可用`}>
            <span>AIGC-CHEN</span>
          </div>
        ) : project.type === "video" ? (
          <video
            ref={mediaRef}
            src={activeSource}
            poster={project.poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${project.title} 视频预览`}
            onLoadStart={() => {
              setHasFrame(false);
              setIsBuffering(true);
            }}
            onWaiting={() => {
              setHasFrame(false);
              setIsBuffering(true);
            }}
            onStalled={() => {
              setHasFrame(false);
              setIsBuffering(true);
            }}
            onLoadedData={() => {
              setHasFrame(true);
              setIsBuffering(false);
            }}
            onCanPlay={() => {
              setHasFrame(true);
              setIsBuffering(false);
            }}
            onPlaying={() => {
              setHasFrame(true);
              setIsBuffering(false);
            }}
            onError={() => {
              setIsBuffering(false);
              setFailed(true);
            }}
          />
        ) : (
          <img
            src={project.src}
            alt={`${project.title} 项目视觉`}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
        {project.type === "video" && !failed ? (
          <img
            className="media-card__poster"
            src={project.poster}
            alt=""
            aria-hidden="true"
            data-visible={String(!hasFrame || isBuffering)}
          />
        ) : null}
        {!failed ? (
          <VideoLoadingOverlay
            phase={!activeSource ? "hidden" : isBuffering ? "buffering" : !hasFrame ? "skeleton" : "hidden"}
          />
        ) : null}
        {project.type === "video" ? (
          <button
            className="media-card__play"
            type="button"
            aria-label={`大尺寸播放 ${project.title}`}
            onClick={(event) => {
              event.stopPropagation();
              openProject();
            }}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <Play weight="fill" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="media-card__footer">
        <h3>{project.title}</h3>
        <span className="media-card__arrow" aria-hidden="true">
          <ArrowUpRight />
        </span>
      </div>
    </article>
  );
}
