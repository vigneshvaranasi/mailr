const CARD_THUMB_SCROLL_LOCK = `<style id="mailr-card-thumb">
html,body{margin:0!important;overflow:hidden!important}
*{scrollbar-width:none}
::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
</style>`;

export function cardThumbnailSrcDoc(html: string): string {
  const t = html.trim();
  if (!t) return t;
  const snip = t.slice(0, 1200);
  if (/<head\b/i.test(snip)) {
    return t.replace(/<head\b[^>]*>/i, (open) => `${open}${CARD_THUMB_SCROLL_LOCK}`);
  }
  if (/<html\b/i.test(snip)) {
    return t.replace(/<html\b[^>]*>/i, (open) => `${open}<head>${CARD_THUMB_SCROLL_LOCK}</head>`);
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${CARD_THUMB_SCROLL_LOCK}</head><body>${t}</body></html>`;
}