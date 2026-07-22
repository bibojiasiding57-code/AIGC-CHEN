export default function VideoLoadingOverlay({ phase = "hidden" }) {
  if (phase === "hidden") return null;

  const isBuffering = phase === "buffering";
  const label = isBuffering ? "视频缓冲中" : "视频加载中";

  return (
    <span
      className={`video-loading video-loading--${phase}`}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <span className="video-loading__shimmer" aria-hidden="true" />
      <span className="video-loading__content">
        {isBuffering ? <span className="video-loading__spinner" aria-hidden="true" /> : null}
        <span className="video-loading__brand">AIGC-CHEN</span>
        <span>{label}</span>
      </span>
    </span>
  );
}
