import { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";

export default function WorksVideoDialog({ project, onClose }) {
  const dialogRef = useRef(null);
  const videoRef = useRef(null);

  const stopVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
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
      if (dialog.open) dialog.close();
      return undefined;
    }

    if (!dialog.open) dialog.showModal();
    videoRef.current?.play().catch(() => undefined);

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
          <video
            ref={videoRef}
            className="works-dialog__video"
            src={project.src}
            controls
            autoPlay
            playsInline
            preload="metadata"
            aria-label={`${project.title} 大尺寸视频`}
          />
        </div>
      ) : null}
    </dialog>
  );
}
