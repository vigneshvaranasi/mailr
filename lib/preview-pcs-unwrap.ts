export function hasPrefersColorSchemeDarkInStyleTags(html: string): boolean {
  return /<style\b[^>]*>[\s\S]*?prefers-color-scheme\s*:\s*dark[\s\S]*?<\/style>/i.test(
    html,
  );
}

function extractBalancedBlock(
  s: string,
  openBraceIdx: number,
): { end: number; inner: string } | null {
  let depth = 0;
  for (let i = openBraceIdx; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return { end: i, inner: s.slice(openBraceIdx + 1, i) };
      }
    }
  }
  return null;
}

export function unwrapDarkMediaQueries(css: string): string {
  let i = 0;
  let out = "";
  while (i < css.length) {
    const next = css.indexOf("@media", i);
    if (next === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, next);
    const openBrace = css.indexOf("{", next);
    if (openBrace === -1) {
      out += css.slice(next);
      break;
    }
    const prelude = css.slice(next, openBrace);
    const block = extractBalancedBlock(css, openBrace);
    if (!block) {
      out += css.slice(next);
      break;
    }
    const { end, inner } = block;
    if (/\(\s*prefers-color-scheme\s*:\s*light\s*\)/i.test(prelude)) {
      i = end + 1;
      continue;
    }
    if (/\(\s*prefers-color-scheme\s*:\s*dark\s*\)/i.test(prelude)) {
      out += unwrapDarkMediaQueries(inner);
    } else {
      out += css.slice(next, end + 1);
    }
    i = end + 1;
  }
  return out;
}

export function transformStyleTagsContents(
  html: string,
  transform: (css: string) => string,
): string {
  return html.replace(
    /<style(\s[^>]*)?>([\s\S]*?)<\/style>/gi,
    (_full, attrs: string | undefined, content: string) => {
      const a = attrs ?? "";
      try {
        return `<style${a}>${transform(content)}</style>`;
      } catch {
        return `<style${a}>${content}</style>`;
      }
    },
  );
}