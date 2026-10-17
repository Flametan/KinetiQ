/**
 * Löst einen Root-relativen Public-Asset-Pfad (z. B. '/exercises/foo.jpg') gegen die
 * tatsächliche Deploy-Basis auf. Nötig, weil solche Pfade in JS-Strings – anders als
 * Referenzen in index.html – nicht automatisch von Vite umgeschrieben werden, wenn die
 * App nicht im Domain-Root liegt (z. B. GitHub Pages unter '/KinetiQ/').
 */
export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
