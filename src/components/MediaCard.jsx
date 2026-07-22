import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play } from "@phosphor-icons/react";
import {
  useVideoBandwidthController,
  useVideoBandwidthRegistration,
} from "../video/VideoBandwidthContext";

export default function MediaCard({ project, featured = false, onOpen }) {
  const mediaRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const ownerId = `preview:${project.id}`;
  const bandwidth = useVideoBandwidthController();
  const containerRef = useRef(null);
  useVideoBandwidthRegistration({
    id: ownerId,
    group: "preview",
    src: project.type === "video" ? project.src : undefined,
    mediaRef,
  });
  const isActive = bandwidth.ownership.mode === "preview" && bandwidth.ownership.ownerId === ownerId;

  const playPreview = () => {
    if (project.type === "video") {
      setHasFrame(false);
      setIsBuffering(true);
      bandwidth.activatePreview(ownerId);
    }
  };

  const resetPreview = () => {
    if (project.type === "video") {
      bandwidth.releasePreview(ownerId);
      setHasFrame(false);
      setIsBuffering(false);
    }
  };

  useEffect(() => () => resetPreview(), [project.src]);

  useEffect(() => {
    if (isActive) return;
    setHasFrame(false);
    setIsBuffering(false);
  }, [isActive]);

  const openProject = () => {
    resetPreview();
    if (onOpen) bandwidth.activateModal(`modal:${project.id}`);
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
