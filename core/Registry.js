/**
 * Registry - the single source of truth for "what components exist and how
 * should the parser treat their tags" (type, allowChildren, selfClosing).
 * It deliberately knows nothing about *which theme* implements a component
 * or how to load its JS/CSS - that's ThemeManager's job. Keeping the two
 * separate means a component is fully registered (and therefore correctly
 * parsed and reflowed) even before any theme file for it has ever loaded,
 * which matters because parsing must be synchronous-ish and theme loading
 * is inherently async.
 */
export class Registry {
  constructor() {
    this._entries = new Map(); // lower-cased tag name -> descriptor
  }

  /**
   * @param {object} descriptor
   * @param {string} descriptor.name - PascalCase component name, e.g. "Button"
   * @param {"Template"|"Element"} descriptor.type
   * @param {boolean} [descriptor.allowChildren] - default: false for Templates, true for Elements
   * @param {boolean} [descriptor.selfClosing] - default: true. Documents whether authors may
   *   write <Name/>. Templates always support this robustly (see reflowVoidComponents); for
   *   Elements with allowChildren:true it's authoring guidance rather than an enforced rule,
   *   because HTML's own parser can't tell Reactless whether a `/>` was actually present once
   *   the page has already been parsed (see ARCHITECTURE.md, "Self-closing custom tags").
   * @param {string} [descriptor.basePath] - override the conventional themes/css folder root
   *   for just this component (for custom, non-convention components registered by an app).
   */
  register(descriptor) {
    if (!descriptor || !descriptor.name || !descriptor.type) {
      throw new Error('[Reactless] register() requires at least { name, type }.');
    }
    const { name, type } = descriptor;
    if (type !== 'Template' && type !== 'Element') {
      throw new Error(`[Reactless] Unknown component type "${type}" for "${name}" - expected "Template" or "Element".`);
    }

    const key = name.toLowerCase();
    const existing = this._entries.get(key);
    const entry = {
      name,
      type,
      allowChildren: descriptor.allowChildren ?? existing?.allowChildren ?? (type === 'Template' ? false : true),
      selfClosing: descriptor.selfClosing ?? existing?.selfClosing ?? true,
      basePath: descriptor.basePath ?? existing?.basePath ?? null,
    };

    if (type === 'Template' && entry.allowChildren) {
      console.warn(`[Reactless] "${name}" is a Template registered with allowChildren:true - Templates are always rendered childless; the flag is ignored.`);
      entry.allowChildren = false;
    }

    this._entries.set(key, entry);
    return entry;
  }

  get(tagNameOrName) {
    return this._entries.get(String(tagNameOrName).toLowerCase());
  }

  has(tagNameOrName) {
    return this._entries.has(String(tagNameOrName).toLowerCase());
  }

  allEntries() {
    return [...this._entries.values()];
  }
}
