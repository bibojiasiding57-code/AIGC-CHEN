import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./components/LaserFlow", () => ({
  default: () => <div data-testid="laser-flow" />,
}));

vi.mock("./components/SplitText", () => ({
  default: ({ tag: Tag = "p", text, className = "", ...props }) => {
    const {
      delay,
      duration,
      ease,
      splitType,
      from,
      to,
      threshold,
      rootMargin,
      textAlign,
      ...elementProps
    } = props;
    return (
      <Tag {...elementProps} className={["split-parent", className].filter(Boolean).join(" ")}>
        {text}
      </Tag>
    );
  },
}));

vi.mock("./components/ClickSpark", () => ({
  default: ({ children }) => <div data-testid="click-spark-root">{children}</div>,
}));

vi.mock("./components/TargetCursor", () => ({
  default: () => <span data-testid="target-cursor" />,
}));

function installExperienceMatchMedia({ desktop, motion }) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query) => ({
      matches: query.includes("min-width") ? desktop : motion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AIGC-CHEN portfolio", () => {
  it("mounts the global and locally scoped visual effects", () => {
    const { container } = render(<App />);
    const sparkRoot = screen.getByTestId("click-spark-root");
    const characterSection = container.querySelector(".section--about");
    const projectGrid = container.querySelector(".project-grid");

    expect(sparkRoot.querySelector("main.site-shell")).toBeInTheDocument();
    expect(characterSection).toContainElement(screen.getByTestId("target-cursor"));
    expect(characterSection.querySelectorAll(".cursor-target")).toHaveLength(6);
    expect(projectGrid.querySelectorAll(":scope > .media-card")).toHaveLength(13);
    expect(container.querySelector(".border-glow-card")).not.toBeInTheDocument();
    expect(container.querySelector(".bento-grid")).not.toBeInTheDocument();
  });

  it("renders the approved email, removes telephone UI, and copies the canonical address", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const { container } = render(<App />);
    const emailLink = screen.getByRole("link", { name: /3845498804@qq\.com/i });

    expect(emailLink).toHaveAttribute("href", "mailto:3845498804@qq.com");
    expect(container.querySelector('a[href^="tel:"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/\+86/)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "致力于将前沿 AIGC 技术、数字影像美学与品牌深度叙事完美融合。如果你正在寻找商业视觉与品牌营销的全新解法，欢迎随时畅聊。",
      ),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "复制邮箱" }));
    expect(writeText).toHaveBeenCalledWith("3845498804@qq.com");
    expect(await screen.findByText("邮箱已复制")).toBeVisible();
  });

  it("binds the Japanese-style Hero video and removes the scroll pill", () => {
    render(<App />);
    const video = screen.getByLabelText("AIGC-CHEN 日系风格影像");

    expect(video).toHaveAttribute("src", "/videos/japanese-style-test.mp4");
    expect(video).toHaveAttribute("poster", "/media/works/posters/japanese-style-test.webp");
    expect(screen.queryByRole("link", { name: "SCROLL" })).not.toBeInTheDocument();
  });

  it("binds the test-success experience video and preserves the right magazine cards", () => {
    render(<App />);

    const video = screen.getByLabelText("测试成功动态影像");
    expect(video).toHaveAttribute("src", "/videos/test-success.mp4");
    expect(video).toHaveAttribute("poster", "/media/works/posters/test-success.webp");
    expect(video).toHaveAttribute("preload", "metadata");

    expect(screen.getByAltText("红黑时尚编辑视觉")).toHaveAttribute(
      "src",
      "/media/fashion-editorial.jpg",
    );
    expect(screen.getByAltText("赛博角色编辑视觉")).toHaveAttribute(
      "src",
      "/media/cyber-editorial.jpg",
    );
  });

  it("renders the final 13 works in the confirmed DOM order", () => {
    const expectedTitles = [
      "啊维塔广告", "氛围短片", "做着玩的", "fs21", "pv", "测试成功",
      "好想回到那个时候", "日系风格测试", "风格测试",
      "暗夜风格", "vlog.mv", "vlog", "mv.vlog",
    ];
    const { container } = render(<App />);
    const titles = [...container.querySelectorAll(".project-grid .media-card h3")].map(
      (heading) => heading.textContent,
    );

    expect(screen.getByText("13 PROJECTS / 2026")).toBeVisible();
    expect(titles).toEqual(expectedTitles);
  });

  it("opens the large player when a work visual is double clicked", () => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const { container } = render(<App />);

    fireEvent.doubleClick(container.querySelector(".project-grid .media-card__visual"));
    expect(screen.getByRole("dialog", { name: "啊维塔广告 大尺寸播放器" })).toBeVisible();
  });

  it("preserves the animated hero title semantics", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { level: 1, name: "AIGC-CHEN · WELCOME" });
    expect(heading).toHaveAttribute("id", "hero-title");
    expect(heading).toHaveClass("hero__title", "split-parent");
  });

  it("loads LaserFlow on desktop when motion is allowed", async () => {
    installExperienceMatchMedia({ desktop: true, motion: true });
    render(<App />);
    expect(await screen.findByTestId("laser-flow")).toBeVisible();
  });

  it.each([
    { desktop: false, motion: true },
    { desktop: true, motion: false },
  ])("does not load LaserFlow for lightweight mode", async (matches) => {
    installExperienceMatchMedia(matches);
    render(<App />);
    expect(screen.queryByTestId("laser-flow")).not.toBeInTheDocument();
  });

  it("renders the required portfolio sections", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "角色介绍" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "作品案例" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "互动体验" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "联系方式" })).toBeTruthy();
  });

  it("switches the interactive mood", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /柔光/ }));
    expect(screen.getByTestId("experience-stage").dataset.mood).toBe("soft");
  });

  it("marks the selected mood button as pressed", () => {
    render(<App />);
    const button = screen.getByRole("button", { name: /脉冲/ });
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("renders all six characters in order with the preserved three-level hierarchy", () => {
    const { container } = render(<App />);
    const cards = [...container.querySelectorAll(".character-card")];

    expect(cards).toHaveLength(6);
    expect(cards.map((card) => card.querySelector("h3")?.textContent)).toEqual([
      "Neo-Youth Icon",
      "Valkyrie Ascendant",
      "Desert Maverick",
      "Ethereal Muse",
      "Midnight Elegance",
      "Urban Vanguard",
    ]);
    cards.forEach((card) => {
      const body = card.querySelector(".character-card__body");
      expect([...body.children].map(({ tagName }) => tagName)).toEqual(["P", "H3", "SPAN"]);
      expect(card).not.toHaveAttribute("style");
    });
    expect(cards[4].querySelector("img")).toHaveStyle({ "--character-zoom": "1.12" });
    expect(cards[5].querySelector("img")).toHaveStyle({ "--character-zoom": "1.18" });
  });

  it("updates local reveal coordinates and clears them on leave", () => {
    let nextFrame;
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      nextFrame = callback;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("PointerEvent", MouseEvent);

    render(<App />);
    const stage = screen.getByTestId("experience-stage");
    const media = screen.getAllByTestId("reveal-media");

    media.forEach((node, index) => {
      vi.spyOn(node, "getBoundingClientRect").mockReturnValue({
        left: 20 + index * 10,
        top: 30 + index * 10,
        right: 320,
        bottom: 330,
        width: 300,
        height: 300,
        x: 20,
        y: 30,
        toJSON: () => ({}),
      });
    });

    fireEvent.pointerMove(stage, { clientX: 180, clientY: 210 });
    act(() => nextFrame(16));

    expect(media[0].style.getPropertyValue("--reveal-x")).toBe("160px");
    expect(media[0].style.getPropertyValue("--reveal-y")).toBe("180px");
    expect(media[0]).toHaveAttribute("data-reveal-active", "true");

    fireEvent.pointerLeave(stage);
    expect(media[0]).not.toHaveAttribute("data-reveal-active");
    expect(media[0].style.getPropertyValue("--reveal-x")).toBe("-9999px");
  });

  it("cancels pending reveal work when the pointer leaves", () => {
    let nextFrame;
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      nextFrame = callback;
      return 7;
    });
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
    vi.stubGlobal("PointerEvent", MouseEvent);

    render(<App />);
    const stage = screen.getByTestId("experience-stage");
    const media = screen.getAllByTestId("reveal-media");

    fireEvent.pointerMove(stage, { clientX: 180, clientY: 210 });
    fireEvent.pointerLeave(stage);

    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);

    act(() => nextFrame(16));
    expect(media[0]).not.toHaveAttribute("data-reveal-active");
    expect(media[0].style.getPropertyValue("--reveal-x")).toBe("-9999px");
  });

  it("keeps one video instance inside the interactive media layer", () => {
    render(<App />);
    const stage = screen.getByTestId("experience-stage");
    expect(stage.querySelectorAll(".experience-stage__media video")).toHaveLength(1);
  });
});
