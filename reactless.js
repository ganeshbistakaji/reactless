import { Registry } from "./core/Registry.js";
import { Loader } from "./core/Loader.js";
import { ThemeManager } from "./core/ThemeManager.js";
import { Renderer } from "./core/Renderer.js";
import { Parser } from "./core/Parser.js";

class ReactlessRuntime {
  constructor() {
    this.registry = new Registry();
    this.loader = new Loader();

    /**
     * import.meta.url is this module's own absolute URL;
     * used (rather than document.currentScript, which is always null for type="module" scripts)
     * so every theme/CSS path resolves correctly regardless of which page includes reactless.js
     * or from what relative location.
     */
    this.themeManager = new ThemeManager({
      loader: this.loader,
      basePath: new URL(".", import.meta.url).href,
    });

    this.renderer = new Renderer({
      registry: this.registry,
      themeManager: this.themeManager,
    });

    this.parser = new Parser({
      registry: this.registry,
      renderer: this.renderer,
    });

    this._booted = false;
  }

  /** Public extensibility API - register a fully custom component. Accepts
   *  the same descriptor shape as the built-ins: { name, type, allowChildren?, selfClosing?, basePath? }. */
  register(descriptor) {
    return this.registry.register(descriptor);
  }

  /** Reactless.config({ theme: 'reactless' }) sets the page-wide default
   *  theme for any component that doesn't specify its own theme="..." attribute. */
  async config({ theme } = {}) {
    if (theme) {
      this.themeManager.setDefaultTheme(theme);
      await this._loadThemeManifest(theme);
    }
  }

  async _loadThemeManifest(themeName) {
    const components = await this.themeManager.loadManifest(themeName);
    components.forEach((d) => this.registry.register(d));
  }

  /** Re-scans a subtree for unprocessed component tags. Exposed publicly so
   *  apps that inject HTML dynamically (after the initial page load) can
   *  call Reactless.scan(newContainer) themselves,
   *  "Dynamic content after initial load". */
  async scan(root = document.body) {
    await this.parser.parse(root);
  }

  async _boot() {
    if (this._booted) return;
    this._booted = true;

    // Load components from the initial default theme manifest before scanning
    await this._loadThemeManifest(this.themeManager.defaultTheme);

    await this.scan(document.body);
    document.dispatchEvent(new CustomEvent("reactless:ready"));
  }
}

const Reactless = new ReactlessRuntime();
window.Reactless = Reactless;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Reactless._boot());
} else {
  Reactless._boot();
}

export default Reactless;
