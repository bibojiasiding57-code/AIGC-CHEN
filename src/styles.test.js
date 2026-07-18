import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("experience reveal stylesheet", () => {
  it("sets non-inheriting active reveal radii on the dimmer that consumes them", () => {
    expect(stylesheet).toMatch(
      /\.reveal-media\[data-reveal-active="true"\]\s+\.reveal-media__dimmer\s*\{[^}]*--reveal-core:\s*120px;[^}]*--reveal-edge:\s*240px;/s,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*760px\)[\s\S]*?\.reveal-media\[data-reveal-active="true"\]\s+\.reveal-media__dimmer\s*\{[^}]*--reveal-core:\s*72px;[^}]*--reveal-edge:\s*150px;/s,
    );
  });
});

describe("Hero bottom alignment stylesheet", () => {
  it("bottom-aligns the full content stack and keeps the title fluid", () => {
    expect(stylesheet).toMatch(
      /\.hero__content\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*justify-content:\s*flex-end;[^}]*padding:\s*0 clamp\(28px,\s*5vw,\s*88px\) clamp\(14px,\s*1\.6vw,\s*26px\);/s,
    );
    expect(stylesheet).toMatch(
      /\.hero h1\s*\{[^}]*font-size:\s*clamp\(24px,\s*6\.9vw,\s*130px\);[^}]*white-space:\s*nowrap;/s,
    );
    expect(stylesheet).not.toMatch(/\.hero__scroll\s*\{/);
  });

  it("keeps the single-line title inside a 360px mobile viewport", () => {
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*760px\)[\s\S]*?\.hero h1\s*\{[^}]*font-size:\s*clamp\(22px,\s*6\.7vw,\s*28px\);[^}]*white-space:\s*nowrap;/,
    );
  });
});

describe("Character card stylesheet", () => {
  it("uses one shared cover crop and stable Character card geometry", () => {
    expect(stylesheet).toMatch(
      /\.character-card\s*\{[^}]*height:\s*clamp\(390px,\s*30vw,\s*490px\);/s,
    );
    expect(stylesheet).toMatch(
      /\.character-card__image img\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*cover;/s,
    );
    expect(stylesheet).toMatch(
      /\.character-card__image img\s*\{[^}]*transform-origin:\s*var\(--character-origin,\s*50% 50%\);[^}]*transform:\s*scale\(var\(--character-zoom,\s*1\)\);/s,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*760px\)[\s\S]*?\.character-card\s*\{[^}]*height:\s*420px;/,
    );
  });
});

describe("Interactive Experience copy layout", () => {
  it("moderately lowers and shrinks the desktop copy", () => {
    expect(stylesheet).toMatch(
      /\.experience-stage__copy\s*\{[^}]*left:\s*7%;[^}]*bottom:\s*6%;/s,
    );
    expect(stylesheet).toMatch(
      /\.experience-stage__copy h3\s*\{[^}]*font-size:\s*clamp\(36px,\s*4\.7vw,\s*76px\);/s,
    );
  });

  it("keeps the mobile copy below the media without overflow pressure", () => {
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*760px\)[\s\S]*?\.experience-stage__copy\s*\{[^}]*margin-top:\s*24px;/,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*760px\)[\s\S]*?\.experience-stage__copy h3\s*\{[^}]*font-size:\s*clamp\(32px,\s*10vw,\s*50px\);/,
    );
  });
});

describe("Contact privacy layout", () => {
  it("uses two balanced actions and leaves no phone-specific navigation styles", () => {
    expect(stylesheet).toMatch(
      /\.pill-nav\s*\{[^}]*grid-template-columns:\s*minmax\(520px,\s*1fr\)\s+auto;/s,
    );
    expect(stylesheet).toMatch(
      /\.contact-actions\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*2fr\)\s+minmax\(220px,\s*1fr\);/s,
    );
    expect(stylesheet).not.toContain(".pill-nav__phone");
  });
});
