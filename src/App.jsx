import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  Check,
  Copy,
  DotsNine,
  EnvelopeSimple,
  MagnifyingGlass,
  Sparkle,
} from "@phosphor-icons/react";
import MediaCard from "./components/MediaCard";
import ClickSpark from "./components/ClickSpark";
import ExperienceVideo from "./components/ExperienceVideo";
import RevealMedia from "./components/RevealMedia";
import SectionHeading from "./components/SectionHeading";
import SplitText from "./components/SplitText";
import TargetCursor from "./components/TargetCursor";
import WorksVideoDialog from "./components/WorksVideoDialog";
import { characters, contact, navItems, projects, resolveVideoSrc } from "./data/portfolio";
import useLaserFlowEnabled from "./hooks/useLaserFlowEnabled";
import { getCopyFeedback, getSectionId } from "./utils/ui";

const LaserFlow = lazy(() => import("./components/LaserFlow"));

const moods = [
  { id: "immersive", label: "沉浸", caption: "Deep / Cinematic" },
  { id: "soft", label: "柔光", caption: "Soft / Dreamlike" },
  { id: "pulse", label: "脉冲", caption: "Pulse / Electric" },
];

export default function App() {
  const [mood, setMood] = useState("immersive");
  const [characterQuery, setCharacterQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const laserFlowEnabled = useLaserFlowEnabled();
  const experienceRef = useRef(null);
  const experienceRafRef = useRef(null);
  const pendingPointerRef = useRef(null);
  const characterTrackRef = useRef(null);
  const characterSectionRef = useRef(null);

  const visibleCharacters = characters.filter((character) => {
    const haystack = `${character.name} ${character.title} ${character.discipline}`.toLowerCase();
    return haystack.includes(characterQuery.trim().toLowerCase());
  });

  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const handleNav = (event, href) => {
    event.preventDefault();
    document.getElementById(getSectionId(href))?.scrollIntoView({ behavior: "smooth" });
  };

  const clearExperienceReveal = useCallback(() => {
    if (experienceRafRef.current !== null) {
      window.cancelAnimationFrame(experienceRafRef.current);
      experienceRafRef.current = null;
    }
    pendingPointerRef.current = null;

    const stage = experienceRef.current;
    if (!stage) return;

    stage.querySelectorAll("[data-reveal-media]").forEach((node) => {
      node.removeAttribute("data-reveal-active");
      node.style.setProperty("--reveal-x", "-9999px");
      node.style.setProperty("--reveal-y", "-9999px");
    });
  }, []);

  const handlePointerMove = (event) => {
    pendingPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    if (experienceRafRef.current !== null) return;

    experienceRafRef.current = window.requestAnimationFrame(() => {
      experienceRafRef.current = null;
      const stage = experienceRef.current;
      const pointer = pendingPointerRef.current;
      if (!stage || !pointer) return;

      const stageRect = stage.getBoundingClientRect();
      stage.style.setProperty("--pointer-x", `${pointer.clientX - stageRect.left}px`);
      stage.style.setProperty("--pointer-y", `${pointer.clientY - stageRect.top}px`);

      stage.querySelectorAll("[data-reveal-media]").forEach((node) => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--reveal-x", `${pointer.clientX - rect.left}px`);
        node.style.setProperty("--reveal-y", `${pointer.clientY - rect.top}px`);
        node.setAttribute("data-reveal-active", "true");
      });
    });
  };

  useEffect(() => {
    window.addEventListener("blur", clearExperienceReveal);
    return () => {
      window.removeEventListener("blur", clearExperienceReveal);
      clearExperienceReveal();
      if (experienceRafRef.current !== null) {
        window.cancelAnimationFrame(experienceRafRef.current);
      }
    };
  }, [clearExperienceReveal]);

  const scrollCharacters = (direction) => {
    const track = characterTrackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.72, behavior: "smooth" });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <ClickSpark
      sparkColor="#dffbff"
      sparkSize={12}
      sparkRadius={22}
      sparkCount={8}
      duration={460}
    >
    <main className="site-shell">
      <section className="hero" aria-labelledby="hero-title">
        <video
          className="hero__video"
          src={resolveVideoSrc("/media/works/japanese-style-test.mp4")}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="AIGC-CHEN 日系风格影像"
        />
        <div className="hero__shade" aria-hidden="true" />

        <div className="hero__brandbar">
          <a href="#top" className="hero__logo" aria-label="AIGC-CHEN 首页">
            AIGC-CHEN
          </a>
          <span>PORTFOLIO / 2026</span>
        </div>

        <div className="hero__content">
          <p className="hero__kicker">
            <Sparkle weight="fill" aria-hidden="true" />
            AI VISUAL DESIGNER / AIGC / CREATIVE DIRECTION
          </p>
          <p className="hero__intro">
            以数字媒体艺术为基础语言，将品牌视觉、AI 生成、影像合成与沉浸式体验融为一体。
          </p>
          <SplitText
            id="hero-title"
            aria-label="AIGC-CHEN · WELCOME"
            tag="h1"
            className="hero__title"
            text="AIGC-CHEN·WELCOME"
            splitType="chars"
            delay={38}
            duration={0.85}
            ease="power3.out"
            from={{ opacity: 0, y: "0.42em" }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="left"
          />
        </div>

      </section>

      <nav className="pill-nav" aria-label="主导航">
        <div className="pill-nav__links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={(event) => handleNav(event, item.href)}>
              {item.label}
            </a>
          ))}
        </div>
        <a className="pill-nav__cta" href="#works" onClick={(event) => handleNav(event, "#works")}>
          <span>查看作品</span>
          <ArrowUpRight aria-hidden="true" />
        </a>
      </nav>

      <div className="category-line" aria-hidden="true">
        <span>DESIGN PROJECT</span>
        <span>DIGITAL MEDIA</span>
        <span>AI VISUAL WORKFLOW</span>
      </div>

      <section
        className="section section--about"
        id="about"
        aria-label="角色介绍"
        ref={characterSectionRef}
      >
        <TargetCursor
          scopeRef={characterSectionRef}
          cursorColor="#A855F7"
          cursorColorOnTarget="#9779b3"
        />
        <SectionHeading
          eyebrow="01 / ROLE"
          title="角色介绍"
          description="在创意、技术和叙事之间工作，让每一次生成都拥有明确的视觉方向。"
        />

        <div className="character-showcase" data-reveal>
          <div className="character-showcase__toolbar">
            <div className="character-showcase__brand">
              <Sparkle weight="fill" aria-hidden="true" />
              <strong>AIGC-CHEN</strong>
              <span>Creative Roles</span>
            </div>

            <label className="character-search">
              <MagnifyingGlass aria-hidden="true" />
              <span className="sr-only">搜索角色</span>
              <input
                type="search"
                value={characterQuery}
                onChange={(event) => setCharacterQuery(event.target.value)}
                placeholder="Search creative roles..."
              />
            </label>

            <button className="character-menu" type="button" aria-label="角色菜单">
              <span>Menu</span>
              <DotsNine weight="bold" aria-hidden="true" />
            </button>
          </div>

          <div className="character-showcase__window">
            <div className="character-track" ref={characterTrackRef}>
              {visibleCharacters.map((character) => (
                <article className="character-card cursor-target" key={character.id}>
                  <div className="character-card__image">
                    <img
                      src={character.image}
                      alt={`${character.name} — ${character.title}`}
                      loading="lazy"
                      style={{
                        objectPosition: character.position,
                        "--character-zoom": character.zoom ?? 1,
                        "--character-origin": character.origin ?? "50% 50%",
                      }}
                    />
                  </div>
                  <div className="character-card__body">
                    <p>{character.discipline}</p>
                    <h3>{character.name}</h3>
                    <span>{character.title}</span>
                  </div>
                </article>
              ))}

              {visibleCharacters.length === 0 ? (
                <p className="character-empty">没有找到对应角色，请尝试其他关键词。</p>
              ) : null}
            </div>
          </div>

          <div className="character-showcase__footer">
            <div className="character-showcase__tags">
              <span>AI FILM</span>
              <span>DIGITAL ART</span>
              <span>BRAND VISUAL</span>
            </div>
            <div className="character-controls" aria-label="角色浏览控制">
              <button type="button" onClick={() => scrollCharacters(-1)} aria-label="上一组角色">
                <CaretLeft aria-hidden="true" />
                <span>Prev</span>
              </button>
              <button type="button" onClick={() => scrollCharacters(1)} aria-label="下一组角色">
                <span>Next</span>
                <CaretRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--works" id="works" aria-labelledby="works-title">
        <SectionHeading
          eyebrow="02 / SELECTED WORK"
          title="作品案例"
          description="影像、海报与角色实验，共同组成不断生长的 AI 视觉档案。"
        />

        <div className="works-titleline">
          <h3 id="works-title">SELECTED PROJECTS</h3>
          <span>14 PROJECTS / 2026</span>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <MediaCard key={project.id} project={project} onOpen={setSelectedProject} />
          ))}
        </div>
        <WorksVideoDialog project={selectedProject} onClose={() => setSelectedProject(null)} />
      </section>

      <section className="section section--experience" id="experience" aria-labelledby="experience-title">
        <SectionHeading
          eyebrow="03 / PLAYGROUND"
          title="互动体验"
          description="移动光标，切换情绪，感受同一个视觉世界在不同能量中的变化。"
          light
        />

        <div
          className="experience-stage"
          data-mood={mood}
          data-testid="experience-stage"
          ref={experienceRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={clearExperienceReveal}
          onPointerCancel={clearExperienceReveal}
          onPointerUp={(event) => {
            if (event.pointerType === "touch") clearExperienceReveal();
          }}
        >
          {laserFlowEnabled ? (
            <Suspense fallback={null}>
              <div className="experience-stage__laser" aria-hidden="true">
                <LaserFlow pointerTargetRef={experienceRef} color="#F6A04D" dpr={1.5} />
              </div>
            </Suspense>
          ) : null}
          <div className="experience-stage__media">
            <RevealMedia
              className="experience-media experience-media--fashion"
              src="/media/fashion-editorial.jpg"
              alt="红黑时尚编辑视觉"
              loading="lazy"
            />
            <RevealMedia
              className="experience-media experience-media--cyber"
              src="/media/cyber-editorial.jpg"
              alt="赛博角色编辑视觉"
              loading="lazy"
            />
            <ExperienceVideo
              className="experience-media experience-media--video"
              src={resolveVideoSrc("/media/works/test-success.mp4")}
              ariaLabel="测试成功动态影像"
            />
          </div>
          <div className="experience-stage__copy">
            <p>LIVE VISUAL FIELD / 03</p>
            <h3 id="experience-title">MOVE THE LIGHT.<br />CHANGE THE FEELING.</h3>
            <span>每一次移动，都是对画面氛围的一次重新导演。</span>
          </div>
          <div className="mood-switcher" aria-label="体验情绪">
            {moods.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMood(item.id)}
                aria-pressed={mood === item.id}
              >
                <span>{item.label}</span>
                <small>{item.caption}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--contact" id="contact" aria-labelledby="contact-title">
        <div className="contact-kicker">
          <span>04 / CONTACT</span>
          <span>AVAILABLE FOR SELECTED PROJECTS</span>
        </div>
        <h2 id="contact-title">联系方式</h2>
        <p>致力于将前沿 AIGC 技术、数字影像美学与品牌深度叙事完美融合。如果你正在寻找商业视觉与品牌营销的全新解法，欢迎随时畅聊。</p>

        <div className="contact-actions">
          <a href={`mailto:${contact.email}`}>
            <EnvelopeSimple aria-hidden="true" />
            <span>{contact.email}</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
          <button type="button" onClick={copyEmail}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            <span>{getCopyFeedback(copied, copyFailed)}</span>
          </button>
        </div>

        <footer className="site-footer">
          <strong>AIGC-CHEN</strong>
          <span>AI DESIGNER / SHANGHAI · CHINA</span>
          <span>© 2026 ALL VISUALS RESERVED</span>
        </footer>
      </section>
    </main>
    </ClickSpark>
  );
}
