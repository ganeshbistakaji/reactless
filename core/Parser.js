const MAX_REFLOW_PASSES = 100;

/**
 * Parser - orchestrates a full pass over a DOM subtree, in three steps:
 *
 *   1. reflowVoidComponents() - fixes the one real HTML-parsing gotcha this
 *      framework's <Name/> syntax runs into (see ARCHITECTURE.md,
 *      "Self-closing custom tags"). HTML does not treat unknown elements as
 *      void, so `<Hero title="x"/>` does NOT self-close the way it looks
 *      like it should - the browser parses it as `<hero>` still *open*, and
 *      everything that follows in the source (siblings, sometimes the rest
 *      of the page) becomes its children. Since any component registered
 *      with allowChildren:false can never legitimately have real children,
 *      the presence of any child on one of them is unambiguous proof this
 *      happened - so it's fixed by moving those children back out, in
 *      order, to become siblings immediately after their rightful owner.
 *      One pass fixes one level; a chain of several self-closing tags in a
 *      row needs several passes, hence the loop.
 *
 *   2. _markPending() - synchronously flags every element about to be
 *      upgraded with [data-rl-pending], which reactless.css hides via
 *      `visibility:hidden`. This avoids a flash of raw/native content (an
 *      unstyled native <button>, literal template braces, etc.) while the
 *      async theme/JS/CSS loading in step 3 is still in flight.
 *
 *   3. _scanAndRender() - finds top-level registered tags in the subtree
 *      and hands each to the Renderer, which (after inserting its output)
 *      recurses back into Parser for whatever nested tags that output
 *      contains - see Renderer.renderElement.
 */
export class Parser {
  constructor({ registry, renderer }) {
    this.registry = registry;
    this.renderer = renderer;
  }

  reflowVoidComponents(root) {
    for (let pass = 0; pass < MAX_REFLOW_PASSES; pass++) {
      const el = this._nextVoidComponentWithChildren(root);
      if (!el) return;
      const parent = el.parentNode;
      const kids = Array.from(el.childNodes);
      console.warn(`[Reactless] <${el.tagName.toLowerCase()}> does not accept children - moving ${kids.length} misplaced node(s) back out to the surrounding document. Tip: <${el.tagName}/> and <${el.tagName}></${el.tagName}> both work fine; just don't put content between them.`);
      const ref = el.nextSibling;
      for (const kid of kids) parent.insertBefore(kid, ref);
    }
    console.warn('[Reactless] Hit the reflow pass limit - check for malformed markup around self-closing components.');
  }

  _nextVoidComponentWithChildren(root) {
    const scope = root.matches ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
    for (const el of scope) {
      const entry = this.registry.get(el.tagName);
      if (entry && entry.allowChildren === false && el.childNodes.length > 0) return el;
    }
    return null;
  }

  _markPending(root) {
    const scope = [root, ...root.querySelectorAll('*')].filter((el) => el.nodeType === 1);
    for (const el of scope) {
      if (this.registry.has(el.tagName) && !el.__rlProcessed) {
        el.setAttribute('data-rl-pending', '');
      }
    }
  }

  async parse(root = document.body) {
    this.reflowVoidComponents(root);
    this._markPending(root);
    await this._scanAndRender(root);
  }

  async _scanAndRender(root) {
    const scope = (root.nodeType === 1 ? [root] : []).concat([...root.querySelectorAll('*')]);
    const candidates = scope.filter((el) => this.registry.has(el.tagName));
    for (const el of candidates) {
      if (el.__rlProcessed || !el.isConnected) continue;
      await this.renderer.renderElement(el, this);
    }
  }
}
