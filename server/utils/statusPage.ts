const COPY = {
  not_found: { title: 'Card not found', body: "We couldn't find this Tappd card. Check the link, or ask the business for help." },
  not_set_up: { title: "This card isn't set up yet", body: 'The business is still getting this card ready. Please try again soon.' },
} as const

const LOGO = '<svg viewBox="0 0 40 40" width="48" height="48" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#5b3fd6"/><circle cx="13" cy="20" r="3.4" fill="#fff"/><g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"><path d="M19 13.5a9 9 0 0 1 0 13"/><path d="M24.5 9a15.5 15.5 0 0 1 0 22"/></g></svg>'

/** Small self-contained page shown when a tapped card can't redirect. Uses Tappd's marketing colors. */
export function statusPageHtml(kind: keyof typeof COPY): string {
  const c = COPY[kind]
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${c.title} · Tappd</title><style>
:root{--bg:#f6f5fb;--fg:#17152a;--muted:#5f5b75;--brand:#5b3fd6}
@media (prefers-color-scheme:dark){:root{--bg:#110f1c;--fg:#eeebf8;--muted:#a9a4c2;--brand:#9c87ff}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--bg);color:var(--fg);font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:420px;text-align:center;display:grid;gap:14px;justify-items:center}h1{margin:0;font-size:26px;letter-spacing:-.02em}p{margin:0;color:var(--muted);line-height:1.55}a{color:var(--brand);font-weight:700}
</style></head><body><main>${LOGO}<h1>${c.title}</h1><p>${c.body}</p><a href="/">What is Tappd?</a></main></body></html>`
}
