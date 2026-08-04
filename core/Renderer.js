/**
 * Renderer - turns one resolved component instance into live DOM. Given a
 * placeholder element the Parser found, it reads attributes, resolves the
 * themed implementation, instantiates the component, renders it to an HTML
 * string, and splices the result into the document in place of the
 * placeholder - then recurses into whatever it just inserted, so nested
 * custom tags (ones an author put inside an Element, or ones a component's
 * own render() output introduces internally) get discovered and processed
 * too, however deep the nesting goes.
 */
export class Renderer {
  constructor({ registry, themeManager }) {
    this.registry = registry;
    this.themeManager = themeManager;
  }

  _readAttributes(el) {
    const out = {};
    for (const attr of el.attributes) out[attr.name] = attr.value;
    return out;
  }

  async renderElement(el, parser) {
    if (!el.isConnected || el.__rlProcessed) return;
    el.__rlProcessed = true; // guard against re-entrant / duplicate scans of the same node

    const entry = this.registry.get(el.tagName);
    const rawAttributes = this._readAttributes(el);
    const rawChildrenHTML = entry.allowChildren ? el.innerHTML : "";

    let resolved;
    try {
      resolved = await this.themeManager.resolve(entry, rawAttributes.theme);
    } catch (err) {
      console.error(err.message);
      el.removeAttribute("data-rl-pending"); // fail open: show the original markup rather than hide it forever
      return;
    }

    const ComponentClass = resolved.module.default;
    if (typeof ComponentClass !== "function") {
      console.error(
        `[Reactless] ${resolved.jsHref} has no default-exported component class.`,
      );
      el.removeAttribute("data-rl-pending");
      return;
    }

    const instance = new ComponentClass({
      name: entry.name,
      attributes: rawAttributes,
      children: rawChildrenHTML,
      theme: resolved.theme,
      node: el,
    });

    let html;
    try {
      html = instance.render();
    } catch (err) {
      console.error(`[Reactless] "${entry.name}".render() threw:`, err);
      el.removeAttribute("data-rl-pending");
      return;
    }

    const template = document.createElement("template");
    template.innerHTML = String(html).trim();
    const topLevelNodes = Array.from(template.content.childNodes);
    const rootElements = topLevelNodes.filter(
      (n) => n.nodeType === Node.ELEMENT_NODE,
    );
    if (rootElements.length > 1) {
      console.warn(
        `[Reactless] "${entry.name}".render() returned ${rootElements.length} root elements - only the first is tracked for mount()/update()/destroy(). Wrap the output in a single element.`,
      );
    }

    const parent = el.parentNode;
    if (!parent) return;
    parent.replaceChild(template.content, el); // moves topLevelNodes into `parent` in place of `el`

    instance.el = rootElements[0] ?? null;
    if (instance.el) instance.el.__rlInstance = instance;

    // Give the instance a way to patch itself back into the live DOM later
    // (used by Component.update()) without Component ever importing Renderer.
    instance._rerenderHook = async (newHtml) => {
      const t = document.createElement("template");
      t.innerHTML = String(newHtml).trim();
      const newNodes = Array.from(t.content.childNodes);
      const oldEl = instance.el;
      if (oldEl && oldEl.parentNode) {
        const p = oldEl.parentNode;
        const ref = oldEl.nextSibling;
        p.removeChild(oldEl);
        for (const n of newNodes) p.insertBefore(n, ref);
      }
      instance.el =
        newNodes.find((n) => n.nodeType === Node.ELEMENT_NODE) ?? null;
      if (instance.el) instance.el.__rlInstance = instance;
      instance.mount(instance.el);
      for (const n of newNodes) {
        if (n.nodeType === Node.ELEMENT_NODE) await parser._scanAndRender(n);
      }
    };

    instance.mount(instance.el);

    // for (const n of topLevelNodes) {
    //   if (n.nodeType === Node.ELEMENT_NODE) await parser._scanAndRender(n);
    // }
    
    for (const n of topLevelNodes) {
      if (n.nodeType === Node.ELEMENT_NODE) {
        // Prevent root elements from triggering a recursive self-loop
        if (this.registry.has(n.tagName)) {
          n.__rlProcessed = true;
        }
        await parser._scanAndRender(n);
      }
    }
  }
}
