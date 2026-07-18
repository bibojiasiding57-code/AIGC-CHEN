import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play } from "@phosphor-icons/react";

export default function MediaCard({ project, featured = false, onOpen }) {
  const mediaRef = useRef(null);
  const [failed, setFailed] = useState(false);

  const playPreview = () => {
    if (project.type === "video") {
      mediaRef.current?.play().catch(() => undefined);
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
            src={project.src}
            poster={project.poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${project.title} 视频预览`}
            onError={() => setFailed(true)}
          />
        ) : (
          <img
            src={project.src}
            alt={`${project.title} 项目视觉`}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
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
