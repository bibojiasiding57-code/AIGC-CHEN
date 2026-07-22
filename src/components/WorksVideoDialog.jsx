import { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";
import {
  useVideoBandwidthController,
  useVideoBandwidthRegistration,
} from "../video/VideoBandwidthContext";

export default function WorksVideoDialog({ project, onClose }) {
  const dialogRef = useRef(null);
  const videoRef = useRef(null);
  const bandwidth = useVideoBandwidthController();
  const { activateModal, releaseModal } = bandwidth;
  const ownerId = `modal:${project?.id ?? "empty"}`;

  useVideoBandwidthRegistration({
    id: ownerId,
    group: "modal",
    src: project?.src,
    mediaRef: videoRef,
  });

  const requestClose = () => {
    releaseModal(ownerId);
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    else onClose?.();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (!project) {
      if (dialog.open) dialog.close();
      return undefined;
    }

    activateModal(ownerId);
    if (!dialog.open) dialog.showModal();
    videoRef.current?.play()?.catch?.(() => {});

    return () => releaseModal(ownerId);
  }, [activateModal, ownerId, project, releaseModal]);

  return (
    <dialog
      ref={dialogRef}
      className="works-dialog"
      aria-label={project ? `${project.title} 大尺寸播放器` : "作品大尺寸播放器"}
      onClose={() => {
        releaseModal(ownerId);
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
              poster={project.poster}
              controls={true}
              autoPlay
              muted
              loop
              playsInline
              webkit-playsinline="true"
              preload="auto"
              aria-label={`${project.title} 大尺寸视频`}
            />
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
