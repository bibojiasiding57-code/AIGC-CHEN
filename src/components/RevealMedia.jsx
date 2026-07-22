export default function RevealMedia({
  as: Tag = "img",
  className = "",
  mediaClassName = "",
  mediaRef,
  ...mediaProps
}) {
  const wrapperClassName = ["reveal-media", className].filter(Boolean).join(" ");
  const assetClassName = ["reveal-media__asset", mediaClassName].filter(Boolean).join(" ");

  return (
    <div className={wrapperClassName} data-reveal-media data-testid="reveal-media">
      <Tag ref={mediaRef} className={assetClassName} {...mediaProps} />
      <span className="reveal-media__dimmer" aria-hidden="true" />
    </div>
  );
}
