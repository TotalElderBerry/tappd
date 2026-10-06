export interface DesignParts { title: string; fontsHref: string; css: string; body: string; script: string }

/** Splits one of the design/*.html files into the parts a Nuxt page needs. The files are used as-is (spec §2.1). */
export function splitDesign(html: string): DesignParts {
  const styleStart = html.indexOf('<style>')
  const styleEnd = html.indexOf('</style>')
  const scriptStart = html.lastIndexOf('<script>')
  const scriptEnd = html.lastIndexOf('</script>')
  if (styleStart < 0 || styleEnd < 0 || scriptStart < 0 || scriptEnd < 0) {
    throw new Error('Design file must contain one <style> block and a trailing <script> block')
  }
  return {
    title: /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? '',
    fontsHref: /<link rel="stylesheet" href="([^"]+)">/.exec(html)?.[1] ?? '',
    css: html.slice(styleStart + '<style>'.length, styleEnd),
    body: html.slice(styleEnd + '</style>'.length, scriptStart).trim(),
    script: html.slice(scriptStart + '<script>'.length, scriptEnd),
  }
}
