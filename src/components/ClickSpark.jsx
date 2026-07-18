import { useEffect, useRef } from "react";
import "./ClickSpark.css";

const easingFunctions = {
  linear: value => value,
  "ease-in": value => value * value,
  "ease-in-out": value => value < 0.5
    ? 2 * value * value
    : -1 + (4 - 2 * value) * value,
  "ease-out": value => value * (2 - value),
};

function ClickSpark({
  sparkColor = "#fff",
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1,
  children,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    let animationFrame = null;
    let disposed = false;
    let sparks = [];

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const nextWidth = Math.round(width * pixelRatio);
      const nextHeight = Math.round(height * pixelRatio);

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (typeof context.setTransform === "function") {
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }
    };

    const ease = easingFunctions[easing] || easingFunctions["ease-out"];

    const draw = timestamp => {
      animationFrame = null;
      if (disposed) return;

      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparks = sparks.filter(spark => {
        const progress = Math.min((timestamp - spark.startTime) / duration, 1);
        if (progress >= 1) return false;

        const eased = ease(Math.max(progress, 0));
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);
        const cos = Math.cos(spark.angle);
        const sin = Math.sin(spark.angle);

        context.strokeStyle = sparkColor;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(spark.x + distance * cos, spark.y + distance * sin);
        context.lineTo(
          spark.x + (distance + lineLength) * cos,
          spark.y + (distance + lineLength) * sin,
        );
        context.stroke();
        return true;
      });

      if (sparks.length > 0) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
    const effectsDisabled = reducedMotion || coarsePointer;

    const handleClick = event => {
      if (effectsDisabled || duration <= 0 || sparkCount <= 0) return;

      const rect = canvas.getBoundingClientRect();
      const startTime = performance.now();
      const count = Math.max(0, Math.floor(sparkCount));
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      sparks.push(...Array.from({ length: count }, (_, index) => ({
        x,
        y,
        angle: (Math.PI * 2 * index) / count,
        startTime,
      })));

      if (animationFrame === null && sparks.length > 0) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    resizeCanvas();
    window.addEventListener("click", handleClick);
    window.addEventListener("resize", resizeCanvas);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(document.documentElement);
    }

    return () => {
      disposed = true;
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", resizeCanvas);
      resizeObserver?.disconnect();
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      sparks = [];
    };
  }, [duration, easing, extraScale, sparkColor, sparkCount, sparkRadius, sparkSize]);

  return (
    <>
      <canvas ref={canvasRef} className="click-spark__canvas" aria-hidden="true" />
      {children}
    </>
  );
}

export default ClickSpark;
