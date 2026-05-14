import {
  hasPrefersColorSchemeDarkInStyleTags,
  transformStyleTagsContents,
  unwrapDarkMediaQueries,
} from "@/lib/preview-pcs-unwrap";

import type { PreviewAppearance } from "@/lib/preview-appearance";

export type { PreviewAppearance };

const SCROLL_LOCK = `<style id="mailr-thumb-scroll">
html,body{margin:0!important;overflow:hidden!important}
*{scrollbar-width:none}
::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
</style>`;

function mailrDarkStyles(branch: "a" | "b"): string {
  if (branch === "b") {
    return `<style id="mailr-preview-dark-invert">
html.mailr-preview-dark.mailr-branch-b{color-scheme:dark}
html.mailr-preview-dark.mailr-branch-b body{
margin:0;
background:#202124!important;
filter:invert(1) hue-rotate(180deg);
}
html.mailr-preview-dark.mailr-branch-b img,
html.mailr-preview-dark.mailr-branch-b video,
html.mailr-preview-dark.mailr-branch-b picture,
html.mailr-preview-dark.mailr-branch-b svg{
filter:invert(1) hue-rotate(180deg);
}
</style>`;
  }
  return `<style id="mailr-preview-dark-author">
html.mailr-preview-dark.mailr-branch-a{color-scheme:dark}
html.mailr-preview-dark.mailr-branch-a body{
margin:0;
background:#202124!important;
}
</style>`;
}

function mergeHtmlClass(attrs: string, extra: string): string {
  const classRe = /class\s*=\s*(["'])([^"']*)\1/i;
  const m = attrs.match(classRe);
  if (m) {
    const quote = m[1];
    const merged = `${m[2]} ${extra}`.trim();
    return attrs.replace(classRe, `class=${quote}${merged}${quote}`);
  }
  return `${attrs} class="${extra}"`;
}

function injectHeadAndHtmlClass(
  html: string,
  headInjection: string,
  htmlClass: string | undefined,
): string {
  let doc = html;
  const headNeedle = 2500;
  const snip = doc.slice(0, headNeedle);

  if (htmlClass && /<html\b/i.test(snip)) {
    doc = doc.replace(/<html\b([^>]*)>/i, (_, attrs: string) => {
      const nextAttrs = mergeHtmlClass(attrs, htmlClass);
      return `<html${nextAttrs}>`;
    });
  }

  if (/<head\b/i.test(doc.slice(0, headNeedle))) {
    return doc.replace(/<head\b[^>]*>/i, (open) => `${open}${headInjection}`);
  }
  if (/<html\b/i.test(doc.slice(0, headNeedle))) {
    return doc.replace(
      /<html\b[^>]*>/i,
      (open) => `${open}<head>${headInjection}</head>`,
    );
  }

  const cls = htmlClass ? ` class="${htmlClass}"` : "";
  return `<!DOCTYPE html><html${cls}><head><meta charset="utf-8"/>${headInjection}</head><body>${doc}</body></html>`;
}

export function buildPreviewSrcDoc(
  html: string,
  options: {
    appearance: PreviewAppearance;
    scrollLock?: boolean;
  },
): string {
  const t = html.trim();
  if (!t) return t;

  let doc = t;

  if (options.appearance === "light") {
    const lightParts: string[] = [`<meta name="color-scheme" content="light">`];
    if (options.scrollLock) lightParts.push(SCROLL_LOCK);
    return injectHeadAndHtmlClass(doc, lightParts.join(""), undefined);
  }

  const hasAuthorPcs = hasPrefersColorSchemeDarkInStyleTags(doc);
  const branch: "a" | "b" = hasAuthorPcs ? "a" : "b";
  if (branch === "a") {
    doc = transformStyleTagsContents(doc, unwrapDarkMediaQueries);
  }

  const htmlClass = `mailr-preview-dark mailr-branch-${branch}`;
  const darkParts: string[] = [
    `<meta name="color-scheme" content="dark">`,
    mailrDarkStyles(branch),
  ];
  if (options.scrollLock) darkParts.push(SCROLL_LOCK);

  return injectHeadAndHtmlClass(doc, darkParts.join(""), htmlClass);
}