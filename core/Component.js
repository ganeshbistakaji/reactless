/**
 * Component - base class for every Reactless component. Template and
 * Element both inherit from this and add nothing but a couple of default
 * flags; every real behaviour lives here so it's identical for all
 * components: attribute parsing/coercion, the standard lifecycle
 * (render -> mount -> update -> destroy), attribute shortcuts on `this`,
 * and a small HTML-escaping helper.
 *
 * update() is able to patch the live DOM without Component importing
 * Renderer (which would create Component -> Renderer -> Component circular
 * imports). Instead, Renderer injects a `_rerenderHook` closure onto each
 * instance right after it mounts it; update() calls that hook if present,
 * and falls back to a bare DOM replace for instances created and mounted
 * by hand, outside the Parser.
 */
export class Component {
  /**
   * @param {object} options
   * @param {string} options.name - registered component name, e.g. "Button"
   * @param {object} [options.attributes] - raw attribute name/value strings straight off the DOM node
   * @param {string} [options.children] - raw (unrendered) innerHTML of the original tag; always '' for Templates
   * @param {string} [options.theme] - the theme this instance actually resolved to, after any fallback
   * @param {Element|null} [options.node] - the original placeholder DOM node Reactless found while scanning
   */
  constructor({ name, attributes = {}, children = '', theme = 'material', node = null } = {}) {
    this.name = name;
    this.theme = theme;
    this.node = node;
    this.children = children;
    this.el = null;              // set once mount() has run against a real, live root element
    this._rerenderHook = null;   // installed by Renderer after first mount; see update() below

    this.rawAttributes = { ...attributes };
    this.attributes = this.constructor.parseAttributes(this.rawAttributes);
    this._applyAttributeShortcuts();
  }

  /** Copies parsed attributes onto `this` for ergonomic `this.title` access,
   *  without ever silently clobbering an existing method or property. */
  _applyAttributeShortcuts() {
    for (const [key, value] of Object.entries(this.attributes)) {
      if (typeof this[key] === 'function') {
        console.warn(`[Reactless] <${this.name}> attribute "${key}" collides with a method of the same name on ${this.constructor.name} - use this.attributes.${key} instead of this.${key}.`);
        continue;
      }
      this[key] = value;
    }
  }

  /** Converts a raw attribute name/value object (as read from the DOM, where
   *  names are always lower-cased and values are always strings) into a
   *  camelCased, type-coerced object. `my-prop` -> `myProp`, since HTML
   *  attribute names are case-insensitive and can't carry camelCase through
   *  the parser - see ARCHITECTURE.md, "Attribute naming". */
  static parseAttributes(rawAttrObj) {
    const parsed = {};
    for (const [rawKey, rawValue] of Object.entries(rawAttrObj)) {
      const key = rawKey.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
      parsed[key] = Component.coerce(rawValue);
    }
    return parsed;
  }

  /** Best-effort string -> JS type coercion: booleans, numbers, and JSON
   *  arrays/objects are recognised automatically; anything else stays a
   *  plain string. This is what lets `rounded="true"` arrive as a real
   *  boolean and `links='[{"label":"Home","href":"#"}]'` arrive as a real
   *  array, with zero configuration from the component author. */
  static coerce(value) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed);
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try { return JSON.parse(trimmed); } catch { /* not valid JSON - keep the raw string */ }
    }
    return value;
  }

  /** Minimal HTML-escaping helper for interpolating attribute-sourced text
   *  into render() templates. Reactless does not sandbox render() output
   *  beyond this - see ARCHITECTURE.md, "Escaping and trust boundary". */
  static escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  escape(str) {
    return Component.escapeHTML(str);
  }

  /** Must return a single root element as an HTML string. Every other
   *  lifecycle method (mount/update/destroy) assumes exactly one root node;
   *  Renderer warns at runtime if render() returns more than one. */
  render() {
    throw new Error(`[Reactless] Component "${this.name}" does not implement render().`);
  }

  /** Called once, right after the rendered output has been inserted into
   *  the live DOM. `el` is the root element render() produced. Override to
   *  attach event listeners, start timers/animations, etc. Always call
   *  super.mount(el) first if you override this. */
  mount(el) {
    this.el = el;
  }

  /** Merges newAttributes in, re-renders, and - if this instance was
   *  mounted through the Renderer - swaps the old DOM for the new DOM in
   *  place and re-scans it for nested components. Falls back to a bare
   *  replace for instances constructed and mounted manually. */
  update(newAttributes = {}) {
    Object.assign(this.rawAttributes, newAttributes);
    this.attributes = this.constructor.parseAttributes(this.rawAttributes);
    this._applyAttributeShortcuts();
    const html = this.render();
    if (this._rerenderHook) {
      this._rerenderHook(html);
    } else if (this.el && this.el.parentNode) {
      const t = document.createElement('template');
      t.innerHTML = String(html).trim();
      this.el.replaceWith(t.content);
    }
  }

  /** Removes the root element from the DOM and clears references. */
  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }

  /** Theme resolution (with fallback) already happened before this instance
   *  was constructed; this just exposes the result. Kept as a real method,
   *  not a plain field, so a future version can support runtime theme
   *  switching (re-resolving and re-rendering) without changing the API. */
  loadTheme() {
    return this.theme;
  }
}
