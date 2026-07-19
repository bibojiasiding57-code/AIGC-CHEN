import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play } from "@phosphor-icons/react";

export default function MediaCard({ project, featured = false, onOpen }) {
  const mediaRef = useRef(null);
  const visualRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const playPreview = () => {
    if (project.type === "video") {
      const media = mediaRef.current;
      if (!media) return;
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
    if (project.type !== "video") return undefined;
    const visual = visualRef.current;
    const media = mediaRef.current;
    if (!visual || !media || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        media.load();
        observer.disconnect();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(visual);
    return () => observer.disconnect();
  }, [project.src, project.type]);

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
        ref={visualRef}
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
            onLoadStart={() => setIsBuffering(true)}
            onWaiting={() => setIsBuffering(true)}
            onStalled={() => setIsBuffering(true)}
            onCanPlay={() => setIsBuffering(false)}
            onPlaying={() => setIsBuffering(false)}
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
        {isBuffering && !failed ? (
          <span className="media-loading" role="status" aria-label="视频缓冲中">
            <span className="media-loading__spinner" aria-hidden="true" />
            <span>视频缓冲中</span>
          </span>
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
