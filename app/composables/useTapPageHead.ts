import raw from '~~/design/07-tap-page-sample.html?raw'
import { splitDesign } from '#shared/designSource'

const design = splitDesign(raw)

/** Loads design/07's CSS and fonts unchanged. Only Tap Page routes call this. */
export function useTapPageHead(title: MaybeRefOrGetter<string>) {
  useHead({
    title,
    link: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      { rel: 'stylesheet', href: design.fontsHref },
    ],
    style: [{ key: 'tap-page-css', innerHTML: design.css }],
  })
}
