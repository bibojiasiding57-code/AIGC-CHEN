import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
import VideoLoadingOverlay from "./VideoLoadingOverlay";

export default function WorksVideoDialog({ project, onClose }) {
  const dialogRef = useRef(null);
  const videoRef = useRef(null);
  const [activeSource, setActiveSource] = useState(project?.src);
  const [hasFrame, setHasFrame] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const stopVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // The selected video may not have loaded enough data to seek.
    }
    video.removeAttribute("src");
    video.load();
    setActiveSource(undefined);
    setHasFrame(false);
    setIsBuffering(false);
  };

  const requestClose = () => {
    stopVideo();
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    } else {
      onClose?.();
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (!project) {
      setIsBuffering(false);
      setHasFrame(false);
      setActiveSource(undefined);
      if (dialog.open) dialog.close();
      return undefined;
    }

    window.dispatchEvent(new CustomEvent("aigcchen:modal-video-open"));
    setActiveSource(project.src);
    setHasFrame(false);
    setIsBuffering(false);
    if (!dialog.open) dialog.showModal();
    const video = videoRef.current;
    if (video) {
      video.setAttribute("src", project.src);
      video.load();
      video.play().catch(() => setIsBuffering(false));
    }

    return stopVideo;
  }, [project]);

  return (
    <dialog
      ref={dialogRef}
      className="works-dialog"
      aria-label={project ? `${project.title} 大尺寸播放器` : "作品大尺寸播放器"}
      onClose={() => {
        stopVideo();
        onClose?.();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose();
      }}
    >
      {project ? (
        <div className="works-dialog__panel">
          <div className="works-dialog__header">
            <div>
              <p>{project.category}</p>
              <h2 id="works-dialog-title">{project.title}</h2>
            </div>
            <button type="button" onClick={requestClose} aria-label="关闭大尺寸播放器">
              <X aria-hidden="true" />
            </button>
          </div>
          <div className="works-dialog__media">
            <video
            ref={videoRef}
            className="works-dialog__video"
              src={activeSource}
            controls
            autoPlay
            playsInline
            preload="auto"
              onLoadStart={() => {
                setHasFrame(false);
                setIsBuffering(false);
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
            onError={() => setIsBuffering(false)}
            aria-label={`${project.title} 大尺寸视频`}
            />
            <img
              className="works-dialog__poster"
              src={project.poster}
              alt=""
              aria-hidden="true"
              data-visible={String(!hasFrame || isBuffering)}
            />
            <VideoLoadingOverlay
              phase={isBuffering ? "buffering" : !hasFrame ? "skeleton" : "hidden"}
            />
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
