import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function readReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

const SplitText = ({
  text = "",
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
  style,
  ...elementProps
}) => {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    let active = true;
    const fonts = document.fonts;
    if (!fonts || fonts.status === "loaded") {
      setFontsLoaded(true);
      return undefined;
    }
    fonts.ready.then(() => {
      if (active) setFontsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded || reducedMotion) return undefined;
      if (animationCompletedRef.current) return undefined;
      const element = ref.current;

      if (element._rbsplitInstance) {
        try {
          element._rbsplitInstance.revert();
        } catch {
          // A stale third-party instance must not block a readable title.
        }
        element._rbsplitInstance = null;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? Number.parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
      const sign =
        marginValue === 0
          ? ""
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      let splitInstance;
      try {
        splitInstance = new GSAPSplitText(element, {
          type: splitType,
          smartWrap: true,
          autoSplit: splitType === "lines",
          linesClass: "split-line",
          wordsClass: "split-word",
          charsClass: "split-char",
          reduceWhiteSpace: false,
          onSplit: (self) => {
            self.chars.forEach((character) => {
              if (character.textContent !== "·") return;

              character.classList.add("split-char--separator");
            });

            let targets;
            if (splitType.includes("chars") && self.chars.length) targets = self.chars;
            if (!targets && splitType.includes("words") && self.words.length) targets = self.words;
            if (!targets && splitType.includes("lines") && self.lines.length) targets = self.lines;
            if (!targets) targets = self.chars || self.words || self.lines;
            if (!targets?.length) return undefined;

            return gsap.fromTo(
              targets,
              { ...from },
              {
                ...to,
                duration,
                ease,
                stagger: delay / 1000,
                scrollTrigger: {
                  trigger: element,
                  start,
                  once: true,
                  fastScrollEnd: true,
                  anticipatePin: 0.4,
                },
                onComplete: () => {
                  animationCompletedRef.current = true;
                  onCompleteRef.current?.();
                },
                willChange: "transform, opacity",
                force3D: true,
              },
            );
          },
        });
      } catch {
        element.textContent = text;
        element.dataset.splitState = "fallback";
        animationCompletedRef.current = true;
        return undefined;
      }

      element._rbsplitInstance = splitInstance;
      element.dataset.splitState = "ready";

      return () => {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === element) trigger.kill();
        });
        try {
          splitInstance.revert();
        } catch {
          element.textContent = text;
        }
        element._rbsplitInstance = null;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
        reducedMotion,
      ],
      scope: ref,
    },
  );

  const Tag = tag || "p";
  const classes = ["split-parent", className].filter(Boolean).join(" ");
  return (
    <Tag
      {...elementProps}
      ref={ref}
      className={classes}
      style={{
        display: "block",
        overflow: "hidden",
        textAlign,
        wordWrap: "break-word",
        willChange: reducedMotion ? "auto" : "transform, opacity",
        ...style,
      }}
    >
      {text}
    </Tag>
  );
};

export default SplitText;
