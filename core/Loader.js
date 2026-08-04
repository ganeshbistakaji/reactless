/**
 * Loader - the only place in Reactless that talks to the network. Injects
 * <link> tags for CSS and uses dynamic import() for JS, and de-duplicates
 * both so that N instances of the same themed component on one page
 * trigger exactly one request each, however many components ask for it
 * concurrently. The cache stores the in-flight Promise, not just the
 * eventual result - that's what makes concurrent de-duplication work,
 * rather than just avoiding *repeat* requests after the first resolves.
 */
export class Loader {
  constructor() {
    this._cssCache = new Map(); // absolute href -> Promise<href>
    this._jsCache = new Map();  // absolute href -> Promise<Module>
  }

  loadCSS(href) {
    if (this._cssCache.has(href)) return this._cssCache.get(href);
    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve(href);
      link.onerror = () => reject(new Error(`[Reactless] Failed to load CSS "${href}".`));
      document.head.appendChild(link);
    });
    this._cssCache.set(href, promise);
    return promise;
  }

  loadJS(href) {
    if (this._jsCache.has(href)) return this._jsCache.get(href);
    const promise = import(href).catch((err) => {
      // Don't cache the failure: a hard 404 for this exact path should stay
      // retry-able (ThemeManager relies on this to attempt a fallback theme
      // without the second attempt being poisoned by the first's rejection).
      this._jsCache.delete(href);
      throw err;
    });
    this._jsCache.set(href, promise);
    return promise;
  }
}
