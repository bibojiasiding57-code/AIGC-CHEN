import { ArrowUpRight, Play } from "@phosphor-icons/react";

export default function MediaCard({ project, featured = false, onOpen }) {
  const openProject = () => onOpen?.(project);

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
        data-video-src={project.src}
        onDoubleClick={openProject}
      >
        <video
          className="media-card__poster"
          poster={project.poster}
          preload="none"
          muted
          loop
          playsInline
          webkit-playsinline="true"
          aria-label={`${project.title} 项目封面`}
        />
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
