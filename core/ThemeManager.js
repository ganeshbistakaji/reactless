import { Loader } from "./Loader.js";

const FALLBACK_THEME = "reactless";

/**
 * ThemeManager - resolves "component X, theme Y" to an actually-loaded JS
 * module (plus best-effort CSS), following Reactless's convention-over-
 * configuration folder layout:
 *
 *   themes/<theme>/<templates|elements>/<Name>.js
 *   css/<theme>/<templates|elements>/<Name>.css
 *
 * Falls back to the "material" theme, once, whenever the requested theme
 * has no implementation for a component, and remembers both successful and
 * fallback resolutions (keyed by component+*requested* theme) so a repeat
 * lookup never touches the network twice, even across many instances of
 * the same tag on one page.
 */
export class ThemeManager {
  constructor({ loader, basePath } = {}) {
    this.loader = loader ?? new Loader();
    this.basePath = basePath; // absolute URL, trailing slash - see reactless.js
    this.defaultTheme = FALLBACK_THEME;
    this._resolutionCache = new Map(); // `${name}:${theme}` -> Promise<resolved>
  }

  async loadManifest(themeName) {
    const root = this.basePath;
    const manifestHref = new URL(`themes/${themeName}/manifest.json`, root)
      .href;

    try {
      const response = await fetch(manifestHref);
      if (!response.ok)
        throw new Error(`Failed to load manifest for theme: ${themeName}`);
      const data = await response.json();
      return data.components || [];
    } catch (err) {
      console.warn(
        `[Reactless] Could not load manifest for theme "${themeName}":`,
        err.message,
      );
      return [];
    }
  }

  setDefaultTheme(theme) {
    this.defaultTheme = theme;
  }

  _folder(type) {
    return type === "Template" ? "templates" : "elements";
  }

  _pathsFor(entry, theme) {
    const root = entry.basePath ?? this.basePath;
    const folder = this._folder(entry.type);
    return {
      jsHref: new URL(`themes/${theme}/${folder}/${entry.name}.js`, root).href,
      // cssHref: new URL(`css/${theme}/${folder}/${entry.name}.css`, root).href,
      cssHref: new URL(`themes/${theme}/css/${folder}/${entry.name}.css`, root).href,
    };
  }

  async resolve(entry, requestedTheme) {
    const theme = requestedTheme || this.defaultTheme;
    const cacheKey = `${entry.name}:${theme}`;
    if (this._resolutionCache.has(cacheKey))
      return this._resolutionCache.get(cacheKey);

    const tryTheme = async (themeName) => {
      const { jsHref, cssHref } = this._pathsFor(entry, themeName);
      const mod = await this.loader.loadJS(jsHref); // rejects on 404 - that's our fallback signal
      this.loader.loadCSS(cssHref).catch((err) => console.warn(err.message)); // CSS is best-effort
      return { module: mod, jsHref, cssHref, theme: themeName };
    };

    const promise = (async () => {
      try {
        return await tryTheme(theme);
      } catch {
        if (theme === FALLBACK_THEME) {
          throw new Error(
            `[Reactless] "${entry.name}" has no implementation in the base "${FALLBACK_THEME}" theme.`,
          );
        }
        console.warn(
          `[Reactless] "${entry.name}" has no "${theme}" implementation - falling back to "${FALLBACK_THEME}".`,
        );
        try {
          return await tryTheme(FALLBACK_THEME);
        } catch {
          throw new Error(
            `[Reactless] "${entry.name}" has no implementation in "${theme}" or fallback "${FALLBACK_THEME}".`,
          );
        }
      }
    })();

    this._resolutionCache.set(cacheKey, promise);
    return promise;
  }
}
