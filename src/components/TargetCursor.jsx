import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import "./TargetCursor.css";

const CORNER_SIZE = 12;
const BORDER_WIDTH = 3;

const getContainingBlock = element => {
  let node = element?.parentElement;
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node);
    if (
      style.transform !== "none" ||
      style.perspective !== "none" ||
      style.filter !== "none" ||
      style.willChange.includes("transform") ||
      style.willChange.includes("perspective") ||
      style.willChange.includes("filter") ||
      /paint|layout|strict|content/.test(style.contain)
    ) return node;
    node = node.parentElement;
  }
  return null;
};

const getContainingBlockOffset = block => {
  if (!block) return { x: 0, y: 0 };
  const rect = block.getBoundingClientRect();
  return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop };
};

const TargetCursor = ({
  scopeRef,
  targetSelector = ".cursor-target",
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
  cursorColor = "#A855F7",
  cursorColorOnTarget = "#9779b3",
}) => {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const cornersRef = useRef([]);
  const spinTimelineRef = useRef(null);
  const tickerRef = useRef(null);
  const activeTargetRef = useRef(null);
  const targetPositionsRef = useRef(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const containingBlockRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [targeting, setTargeting] = useState(false);

  const disabled = useMemo(() => {
    if (typeof window === "undefined") return true;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    const touch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
    return Boolean(reduced || coarse || touch || window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    const scope = scopeRef?.current;
    const cursor = cursorRef.current;
    if (disabled || !scope || !cursor) return undefined;

    cornersRef.current = Array.from(cursor.querySelectorAll(".target-cursor-corner"));
    containingBlockRef.current = getContainingBlock(cursor);
    const originalBodyCursor = document.body.style.cursor;
    let active = false;
    let resumeTimeout = null;

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    spinTimelineRef.current = gsap
      .timeline({ repeat: -1 })
      .to(cursor, { rotation: "+=360", duration: spinDuration, ease: "none" });

    const restoreCursor = () => {
      if (hideDefaultCursor) document.body.style.cursor = originalBodyCursor;
    };

    const removeTicker = () => {
      if (tickerRef.current) gsap.ticker.remove(tickerRef.current);
    };

    const releaseTarget = () => {
      if (!activeTargetRef.current) return;
      removeTicker();
      activeTargetRef.current = null;
      targetPositionsRef.current = null;
      setTargeting(false);
      gsap.killTweensOf(cornersRef.current);
      gsap.to(cornersRef.current, {
        x: 0,
        y: 0,
        borderColor: cursorColor,
        duration: hoverDuration,
        overwrite: true,
      });
      gsap.to(dotRef.current, { backgroundColor: cursorColor, duration: hoverDuration });
      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        if (!activeTargetRef.current) spinTimelineRef.current?.restart();
        resumeTimeout = null;
      }, 50);
    };

    const updateTargetPositions = target => {
      const rect = target.getBoundingClientRect();
      const offset = getContainingBlockOffset(containingBlockRef.current);
      targetPositionsRef.current = [
        { x: rect.left - BORDER_WIDTH - offset.x, y: rect.top - BORDER_WIDTH - offset.y },
        { x: rect.right + BORDER_WIDTH - CORNER_SIZE - offset.x, y: rect.top - BORDER_WIDTH - offset.y },
        { x: rect.right + BORDER_WIDTH - CORNER_SIZE - offset.x, y: rect.bottom + BORDER_WIDTH - CORNER_SIZE - offset.y },
        { x: rect.left - BORDER_WIDTH - offset.x, y: rect.bottom + BORDER_WIDTH - CORNER_SIZE - offset.y },
      ];
    };

    tickerRef.current = () => {
      if (!activeTargetRef.current || !targetPositionsRef.current) return;
      updateTargetPositions(activeTargetRef.current);
      const { x, y } = lastPointerRef.current;
      const offset = getContainingBlockOffset(containingBlockRef.current);
      cornersRef.current.forEach((corner, index) => {
        const destination = targetPositionsRef.current[index];
        gsap.to(corner, {
          x: destination.x - (x - offset.x),
          y: destination.y - (y - offset.y),
          duration: parallaxOn ? 0.16 : 0,
          ease: parallaxOn ? "power1.out" : "none",
          overwrite: "auto",
        });
      });
    };

    const enterScope = () => {
      active = true;
      setVisible(true);
      if (hideDefaultCursor) document.body.style.cursor = "none";
    };

    const leaveScope = () => {
      active = false;
      releaseTarget();
      setVisible(false);
      restoreCursor();
    };

    const move = event => {
      if (!active) return;
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      const offset = getContainingBlockOffset(containingBlockRef.current);
      gsap.to(cursor, {
        x: event.clientX - offset.x,
        y: event.clientY - offset.y,
        duration: 0.1,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const over = event => {
      if (!active || !(event.target instanceof Element)) return;
      const target = event.target.closest(targetSelector);
      if (!target || !scope.contains(target) || target === activeTargetRef.current) return;
      releaseTarget();
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }
      activeTargetRef.current = target;
      updateTargetPositions(target);
      setTargeting(true);
      spinTimelineRef.current?.pause();
      gsap.set(cursor, { rotation: 0 });
      gsap.to(cornersRef.current, { borderColor: cursorColorOnTarget, duration: 0.15 });
      gsap.to(dotRef.current, { backgroundColor: cursorColorOnTarget, duration: 0.15 });
      gsap.ticker.add(tickerRef.current);
      tickerRef.current();
    };

    const out = event => {
      const target = activeTargetRef.current;
      if (target && !target.contains(event.relatedTarget)) releaseTarget();
    };

    const down = () => {
      if (!active) return;
      gsap.to(dotRef.current, { scale: 0.65, duration: 0.15 });
      gsap.to(cursor, { scale: 0.9, duration: 0.15 });
    };
    const up = () => {
      if (!active) return;
      gsap.to(dotRef.current, { scale: 1, duration: 0.15 });
      gsap.to(cursor, { scale: 1, duration: 0.15 });
    };

    const scroll = () => {
      if (!active || !activeTargetRef.current) return;
      const { x, y } = lastPointerRef.current;
      const elementUnderMouse = document.elementFromPoint?.(x, y);
      if (!elementUnderMouse || !activeTargetRef.current.contains(elementUnderMouse)) releaseTarget();
    };

    scope.addEventListener("mouseenter", enterScope);
    scope.addEventListener("mouseleave", leaveScope);
    scope.addEventListener("mousemove", move);
    scope.addEventListener("mouseover", over);
    scope.addEventListener("mouseout", out);
    scope.addEventListener("mousedown", down);
    scope.addEventListener("mouseup", up);
    scope.addEventListener("scroll", scroll, { passive: true });
    const resize = () => { containingBlockRef.current = getContainingBlock(cursor); };
    window.addEventListener("resize", resize);

    return () => {
      scope.removeEventListener("mouseenter", enterScope);
      scope.removeEventListener("mouseleave", leaveScope);
      scope.removeEventListener("mousemove", move);
      scope.removeEventListener("mouseover", over);
      scope.removeEventListener("mouseout", out);
      scope.removeEventListener("mousedown", down);
      scope.removeEventListener("mouseup", up);
      scope.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
      if (resumeTimeout) clearTimeout(resumeTimeout);
      removeTicker();
      spinTimelineRef.current?.kill();
      gsap.killTweensOf([cursor, dotRef.current, ...cornersRef.current]);
      activeTargetRef.current = null;
      targetPositionsRef.current = null;
      restoreCursor();
    };
  }, [
    cursorColor,
    cursorColorOnTarget,
    disabled,
    hideDefaultCursor,
    hoverDuration,
    parallaxOn,
    scopeRef,
    spinDuration,
    targetSelector,
  ]);

  if (disabled) return null;

  return (
    <div
      ref={cursorRef}
      className={`target-cursor-wrapper${visible ? " is-visible" : ""}${targeting ? " is-targeting" : ""}`}
      data-testid="target-cursor"
      aria-hidden="true"
      style={{ "--cursor-color": cursorColor, "--cursor-target-color": cursorColorOnTarget }}
    >
      <span ref={dotRef} className="target-cursor-dot" />
      <span className="target-cursor-corner corner-tl" />
      <span className="target-cursor-corner corner-tr" />
      <span className="target-cursor-corner corner-br" />
      <span className="target-cursor-corner corner-bl" />
    </div>
  );
};

export default TargetCursor;
