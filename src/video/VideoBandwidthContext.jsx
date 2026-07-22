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

function ensureSource(entry) {
  const video = entry.mediaRef.current;
  if (!video || !entry.src) return;
  if (video.getAttribute("src") !== entry.src) {
    video.setAttribute("src", entry.src);
    video.load();
  }
}

function playVideo(entry) {
  const video = entry.mediaRef.current;
  if (!video) return;
  ensureSource(entry);
  if (entry.group === "idle") video.muted = true;
  video.play()?.catch?.(() => {});
}

function pauseVideo(entry) {
  entry.mediaRef.current?.pause();
}

function unloadModal(entry) {
  const video = entry.mediaRef.current;
  if (!video) return;
  video.pause();
  video.removeAttribute("src");
  video.src = "";
  video.removeAttribute("src");
  video.load();
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
      if (current !== entry) return;
      if (entry.group === "modal") unloadModal(entry);
      else pauseVideo(entry);
      registryRef.current.delete(entry.id);
      setRegistryVersion((version) => version + 1);
    };
  }, []);

  useLayoutEffect(() => {
    const entries = [...registryRef.current.values()];
    if (ownership.mode === "modal") {
      entries.forEach((entry) => {
        if (entry.group === "idle") pauseVideo(entry);
        else if (entry.id === ownership.ownerId) playVideo(entry);
        else unloadModal(entry);
      });
      return;
    }

    entries.forEach((entry) => {
      if (entry.group === "idle") playVideo(entry);
      else unloadModal(entry);
    });
  }, [ownership, registryVersion]);

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
    () => ({ ownership, register, activateModal, releaseModal }),
    [activateModal, ownership, register, releaseModal],
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
