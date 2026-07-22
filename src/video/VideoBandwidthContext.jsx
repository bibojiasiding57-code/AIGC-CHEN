import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const VideoBandwidthContext = createContext(null);

function disconnectVideo(video) {
  if (!video) return;
  video.pause();
  video.removeAttribute("src");
  video.src = "";
  video.removeAttribute("src");
  video.load();
}

function connectVideo(entry) {
  const video = entry.mediaRef.current;
  if (!video || !entry.src) return;
  if (video.getAttribute("src") !== entry.src) {
    video.setAttribute("src", entry.src);
    video.load();
  }
  if (entry.group !== "modal") {
    video.muted = true;
  }
  video.play()?.catch?.(() => {});
}

export function VideoBandwidthProvider({ children }) {
  const registryRef = useRef(new Map());
  const [ownership, setOwnership] = useState({ mode: "idle", ownerId: null });
  const [registryVersion, setRegistryVersion] = useState(0);

  const register = useCallback((entry) => {
    registryRef.current.set(entry.id, entry);
    setRegistryVersion((version) => version + 1);
    return () => {
      const current = registryRef.current.get(entry.id);
      if (current === entry) {
        registryRef.current.delete(entry.id);
        setRegistryVersion((version) => version + 1);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const entries = [...registryRef.current.values()];
    const isEligible = (entry) => {
      if (ownership.mode === "idle") return entry.group === "idle";
      return entry.id === ownership.ownerId && entry.group === ownership.mode;
    };

    entries.forEach((entry) => {
      if (!isEligible(entry)) disconnectVideo(entry.mediaRef.current);
    });
    entries.forEach((entry) => {
      if (isEligible(entry)) connectVideo(entry);
    });
  }, [ownership, registryVersion]);

  const activatePreview = useCallback((ownerId) => {
    setOwnership((current) =>
      current.mode === "modal" ? current : { mode: "preview", ownerId },
    );
  }, []);
  const releasePreview = useCallback((ownerId) => {
    setOwnership((current) =>
      current.mode === "preview" && current.ownerId === ownerId
        ? { mode: "idle", ownerId: null }
        : current,
    );
  }, []);
  const activateModal = useCallback((ownerId) => {
    setOwnership({ mode: "modal", ownerId });
  }, []);
  const releaseModal = useCallback((ownerId) => {
    setOwnership((current) =>
      current.mode === "modal" && current.ownerId === ownerId
        ? { mode: "idle", ownerId: null }
        : current,
    );
  }, []);

  const controller = useMemo(
    () => ({
      ownership,
      register,
      activatePreview,
      releasePreview,
      activateModal,
      releaseModal,
    }),
    [activateModal, activatePreview, ownership, register, releaseModal, releasePreview],
  );

  return <VideoBandwidthContext.Provider value={controller}>{children}</VideoBandwidthContext.Provider>;
}

export function useVideoBandwidthController() {
  const context = useContext(VideoBandwidthContext);
  if (!context) throw new Error("Video bandwidth hooks require VideoBandwidthProvider");
  return context;
}

export function useVideoBandwidthRegistration({ id, group, src, mediaRef }) {
  const { register } = useVideoBandwidthController();
  useLayoutEffect(
    () => register({ id, group, src, mediaRef }),
    [group, id, mediaRef, register, src],
  );
}
