import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 721px)";
const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

export default function useLaserFlowEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const motion = window.matchMedia(MOTION_QUERY);
    const update = () => setEnabled(desktop.matches && motion.matches);

    update();
    desktop.addEventListener?.("change", update);
    motion.addEventListener?.("change", update);

    return () => {
      desktop.removeEventListener?.("change", update);
      motion.removeEventListener?.("change", update);
    };
  }, []);

  return enabled;
}
