import { describe, expect, it } from "vitest";
import { characters, contact, projects } from "./portfolio";

const expectedCharacters = [
  ["neo-youth-icon", "YOUTH CULTURE / POP AESTHETICS", "Neo-Youth Icon", "新世代青春图鉴"],
  ["valkyrie-ascendant", "CINEMATIC FANTASY / GAME IP", "Valkyrie Ascendant", "史诗幻想女主角"],
  ["desert-maverick", "OUTDOOR LIFESTYLE / AUTOMOTIVE", "Desert Maverick", "旷野风尚探索者"],
  ["ethereal-muse", "BEAUTY & LUXURY / HIGH FASHION", "Ethereal Muse", "高定纯净美学"],
  ["midnight-elegance", "HIGH LUXURY / PRESTIGE BRAND", "Midnight Elegance", "黑金奢华美学形象"],
  ["urban-vanguard", "EDITORIAL / MODERN FASHION", "Urban Vanguard", "都会摩登风尚图鉴"],
];

const expectedTitles = [
  "啊维塔广告",
  "做着玩的",
  "fs21",
  "pv",
  "汽车广告",
  "测试成功",
  "好想回到那个时候",
  "日系风格测试",
  "风格测试",
  "仿真人短剧",
  "暗夜风格",
  "vlog.mv",
  "vlog",
  "mv.vlog",
];

describe("Works project data", () => {
  it("keeps all 14 projects in the confirmed reading order", () => {
    expect(projects.map(({ title }) => title)).toEqual(expectedTitles);
    expect(new Set(projects.map(({ id }) => id)).size).toBe(14);
    expect(projects.every(({ type }) => type === "video")).toBe(true);
  });

  it("keeps the vlog-like sources unambiguous", () => {
    expect(projects.slice(11).map(({ src }) => src)).toEqual([
      "/media/works/vlog-mv.mp4",
      "/media/works/vlog.mp4",
      "/media/works/mv-vlog.mp4",
    ]);
  });

  it("binds one stable WebP poster to every project", () => {
    expect(projects).toHaveLength(14);
    expect(
      projects.every(({ id, poster }) => poster === `/media/works/posters/${id}.webp`),
    ).toBe(true);
    expect(new Set(projects.map(({ poster }) => poster)).size).toBe(14);
  });
});

describe("Character data", () => {
  it("keeps the approved six-card order and three-level copy", () => {
    expect(characters.map(({ id, discipline, name, title }) => [id, discipline, name, title]))
      .toEqual(expectedCharacters);
    expect(new Set(characters.map(({ id }) => id)).size).toBe(6);
  });

  it("binds the supplied images only to cards five and six", () => {
    expect(characters.slice(4).map(({ image }) => image)).toEqual([
      "/media/characters/midnight-elegance.png",
      "/media/characters/urban-vanguard.png",
    ]);
    expect(characters.slice(4).map(({ zoom, origin }) => [zoom, origin])).toEqual([
      [1.12, "50% 0%"],
      [1.18, "50% 0%"],
    ]);
    expect(characters.every(({ position }) => /^\d+% \d+%$/.test(position))).toBe(true);
  });
});

describe("Contact data", () => {
  it("keeps only the approved public email", () => {
    expect(contact).toEqual({ email: "3845498804@qq.com" });
  });
});
