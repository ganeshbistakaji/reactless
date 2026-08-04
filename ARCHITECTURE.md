# Reactless - Architecture

A vanilla component framework: no virtual DOM, no JSX, no build step. It scans
the DOM for custom tags (`<Hero/>`, `<Button>...</Button>`) and replaces them
with themed, rendered HTML. This document explains why the system is built
the way it is; the code itself lives under `core/`, `themes/`, and `css/`.

## 1. Folder structure

```
reactless/
  reactless.js              <- the only script a consumer includes
  reactless.css              <- the only stylesheet a consumer includes
  core/
    Component.js              base class: attributes, lifecycle, escaping
    Template.js                Component subclass, allowChildren:false
    Element.js                  Component subclass, allowChildren:true
    Registry.js                what components exist + their parse rules
    Loader.js                   CSS <link> injection + JS import(), deduped
    ThemeManager.js             theme path resolution + fallback-to-material
    Renderer.js                 instance -> DOM, recursive nested-tag scan
    Parser.js                   DOM scan, self-closing-tag reflow fix
  themes/<theme>/templates/*.js   one class per Template, per theme
  themes/<theme>/elements/*.js    one class per Element, per theme
  css/<theme>/templates/*.css     CSS mirror of the JS tree above
  css/<theme>/elements/*.css
  demo/index.html
```

Two themes ship in this reference implementation - **material** (the
required fallback theme) and **neobrutalism** (deliberately contrasting, and
deliberately missing an `Alert` implementation so you can see the fallback
system work live). Six components ship - `Hero`, `Navbar`, `Footer`
(Templates) and `Button`, `Card`, `Alert` (Elements) - the same set used as
examples in the spec. Adding a seventh component or a third theme means
adding files in this same shape; nothing in `core/` changes.

## 2. Why each class exists

- **Component** - everything identical across every component: reading and
  type-coercing attributes, the mount/update/destroy lifecycle, an
  `escape()` helper, and attribute shortcuts (`this.title` as well as
  `this.attributes.title`). This is the only class with real logic in it;
  Template and Element are thin.
- **Template / Element** - not code reuse so much as *contracts*. A
  Template's constructor forces `children` to empty and warns if it wasn't
  already, so a bug in the parser upstream fails loudly instead of silently
  rendering wrong content. Element does nothing but flip the default -
  future component types (a `Directive` or `Portal`, say) plug in at the
  same level.
- **Registry** - the parser needs to know, synchronously, whether a tag is
  "a component" and whether it may have children, before any theme file has
  loaded. Registry answers that from a lightweight descriptor
  (`{name, type, allowChildren, selfClosing}`) completely independent of
  which theme eventually implements it.
- **Loader** - the only module that touches the network. Isolating it means
  ThemeManager's fallback logic, and everything above it, can be written and
  tested without caring *how* a module gets fetched.
- **ThemeManager** - translates "component X, theme Y" into a path,
  attempts it, and retries against `material` on failure. This is the one
  policy decision (fallback theme, conventional folder layout) that doesn't
  belong in Loader (too generic) or Renderer (too high-level).
- **Renderer** - the actual DOM surgery: instantiate, render, replace, wire
  up lifecycle, recurse. Kept separate from Parser so the *scanning*
  algorithm and the *replacement* algorithm can change independently.
- **Parser** - top-level orchestration and the one piece of real cleverness,
  the self-closing tag reflow (§3).

## 3. The parsing algorithm

`Reactless._boot()` calls `Parser.parse(document.body)`, which runs three
passes:

**Pass 1 - reflow self-closing components.** This is the load-bearing part
of the whole design, so it's worth explaining in full. HTML does not treat
unknown elements as void. Given:

```html
<Hero title="Welcome" />
<Button color="primary">Click Me</Button>
```

a browser parses `<Hero title="Welcome" />` as an **opening** tag - the `/`
is simply ignored for anything that isn't on HTML's fixed void-element list
- and keeps consuming everything after it, including `<Button>...</Button>`,
as `Hero`'s children, all the way to the next explicit `</hero>` (which
never comes) or the end of its parent. By the time any JavaScript runs,
`document.body` already has the "wrong" tree; there is no way to recover the
original source text's self-closing intent from the live DOM, because the
browser discarded that information during its own parse.

The fix doesn't require re-parsing raw source text, though. Any component
registered with `allowChildren:false` (every Template, by definition) can
*never* legitimately have real children - so the mere presence of one is
unambiguous proof this happened, regardless of why. `reflowVoidComponents()`
finds the first such element with children, and moves those children back
out to become its siblings, in their original order, immediately after it:

```
before:  <hero>  [ <button>Click Me</button> ]
after:   <hero></hero>  <button>Click Me</button>
```

It repeats this until no `allowChildren:false` element has any children left
(bounded at 100 passes, to fail loudly on pathological markup rather than
hang). A chain of several self-closing Templates in a row - `<Hero/><Hero/>
<Footer/>` - needs one pass per link in the chain, because unwrapping the
first only exposes that the second still has the third nested inside *it*;
each pass peels off one more layer, and the loop converges correctly. This
runs purely against the live DOM, so it works identically whether the page
was served over http, opened from `file://`, or the markup was injected
later via `innerHTML` - no extra network round-trip, no separate tokenizer.

The same rule generalizes to any `allowChildren:false` **Element** (an
`<Input/>` or `<Icon/>`, say) - the code keys off the registry flag, not the
Template/Element class split.

**What this does *not* fix:** an Element registered with
`allowChildren:true` - a `Button`, say - is genuinely ambiguous when
self-closed with more content after it, because a real child is a valid,
intended state for that tag. The live DOM can't tell Reactless whether the
source said `<Button/>` (meant to be empty) or `<Button>` (meant to hold
what follows). The documented rule for these is: use an explicit closing tag
whenever you want zero children unambiguously -
`<Button color="primary"></Button>`, not `<Button color="primary"/>` - self-
closing syntax on an `allowChildren:true` Element is a convenience for
*trailing* or *last-child* positions, not a load-bearing guarantee.

**Pass 2 - mark pending.** Every element the registry recognizes gets
`data-rl-pending`, which `reactless.css` hides via `visibility:hidden`. This
runs synchronously, before any `await`, so there's no window where raw
content (an unstyled native `<button>`, a `<hero>` tag's attributes showing
up as inline text) is visible. If a component's theme/JS fails to load or
its `render()` throws, Renderer explicitly removes the attribute in the
error path - a broken component fails **open** (visible, so it's obvious
something is wrong) rather than invisible forever.

**Pass 3 - scan and render.** Walks the subtree in document order, and for
every recognized tag not yet processed, calls `Renderer.renderElement()`.

## 4. The rendering pipeline

For one element: read its attributes off the live DOM node → resolve its
themed implementation via `ThemeManager` (§5) → construct the component
class with `{name, attributes, children, theme, node}` → call `render()` to
get an HTML string → parse that string into a detached `<template>` →
`parentNode.replaceChild()` to splice it into the document in place of the
original tag → call `instance.mount(rootElement)` → **recurse**: scan every
newly-inserted top-level element for further unprocessed tags.

That last step is what makes nesting work at arbitrary depth without a
special case. Two different situations both fall out of the same recursive
call: an author's own nested tag (`<Card><Button/></Card>`, where `Button`
was captured as part of `Card`'s raw `innerHTML` and re-appears, as a *new*
DOM node, once Card's rendered HTML is parsed and inserted); and a
component's own internal implementation detail (a theme's `Hero` could
render a `<Button>` as part of its own template, and it would be discovered
and processed identically). Renderer doesn't need to know which case it's
in.

**One constraint this relies on:** `render()` must return a single root
element. `mount()`/`update()`/`destroy()` all operate on `instance.el`,
which is set to the first element node of whatever `render()` produced.
Renderer warns at runtime (without failing) if it sees more than one root
element - this mirrors the same constraint pre-Fragment React had, for the
same reason: it keeps the lifecycle API simple and unambiguous.

## 5. Theme loading, and the fallback chain

Nothing about theme resolution is configured per-component; it's entirely
convention over configuration. Given a component `Button` (an Element) and a
requested theme `neobrutalism`, `ThemeManager` computes:

```
themes/neobrutalism/elements/Button.js
css/neobrutalism/elements/Button.css
```

resolved against `reactless.js`'s own `import.meta.url` (not the *page's*
URL - this matters, since it's what lets a page anywhere on a site include
`reactless.js` from a shared location and still resolve paths correctly).
It attempts the JS import; if that path 404s, it logs a warning and retries
against `themes/material/elements/Button.js` once. If material is *also*
missing the component, that's a hard error - material is documented as the
theme every component must implement. CSS is loaded in parallel and is
best-effort: a missing CSS file logs a warning but never blocks rendering,
because unstyled-but-functional beats broken.

Resolution results - including the fact that a fallback was needed - are
cached per `component:requestedTheme` pair, so the second `<Alert
theme="neobrutalism">` on a page doesn't re-attempt (and re-fail) the
neobrutalism path a second time.

## 6. The CSS auto-loader

`Loader.loadCSS(href)` creates a `<link rel="stylesheet">`, appends it to
`<head>`, and resolves a Promise on `onload`. The cache is keyed by the
resolved absolute `href` and stores the **Promise**, not just the eventual
result - if three `<Button>` tags on the page all resolve concurrently, all
three see the same in-flight promise and only one `<link>` is ever created,
regardless of timing. A component never explicitly asks for its own CSS;
`ThemeManager.resolve()` does it as a side effect of resolving the JS
module, so authoring a new theme file is enough - there's no separate
manifest to keep in sync.

## 7. The JS module loader

Same de-duplication strategy, using dynamic `import()` instead of `<link>`.
This is the one place the "no build tools" promise has a real cost: dynamic
`import()` of relative paths only works when the page is served over
http(s), not opened directly from `file://` (browsers block module-relative
resolution over `file://` for security reasons), and it does mean
`reactless.js` itself must be included with `type="module"` - the one
attribute added to the two-tag include the spec asked for, because it's the
only way to get real ES module semantics with zero bundler. A failed import
(missing file, syntax error in a theme file) rejects the cached promise and
removes it from the cache rather than caching the failure, which is what
lets `ThemeManager`'s fallback retry a different path for the same
component without that retry being poisoned by the first attempt.

## 8. The component registry

Deliberately minimal: name, type, `allowChildren`, `selfClosing`,
optional `basePath` override. It answers exactly two questions the parser
needs *before* any async work happens - "is this a component?" and "can it
have children?" - and nothing else. It does not know about themes, loaded
classes, or CSS; that separation is what lets parsing (which must be fast
and synchronous-feeling) stay decoupled from loading (which is inherently
async and can fail).

`selfClosing` is stored as authoring metadata - "is `<Name/>` a supported
way to write this tag" - used today for documentation and available as a
hook for a future dev-mode linter. It does not drive `reflowVoidComponents`,
which keys off `allowChildren` instead, because (per §3) that's the flag
where the ambiguity is actually resolvable.

## 9. How nested components work

Three distinct mechanisms cover three distinct situations:

1. **A Template followed by other tags**, mis-nested by HTML's parser →
   fixed once, structurally, before rendering begins (§3, pass 1).
2. **An Element authored with real nested children**
   (`<Card><Button/></Card>`, both properly closed) → the browser's DOM
   already has this right; `Card`'s `innerHTML` is captured as `children`
   before rendering, re-inserted verbatim as part of `Card`'s rendered HTML,
   and then recursively re-scanned once it's back in the live document
   (§4).
3. **A theme's own render() output referencing another component
   internally** → handled by the exact same recursive re-scan as (2);
   Renderer doesn't distinguish "children the author wrote" from "children
   a component's template introduced".

## 10. Templates vs. Elements, internally

The distinction is almost entirely about `allowChildren`, enforced in two
places for different reasons. `Registry.register()` refuses to let a
`Template` be registered with `allowChildren:true` - a policy check, so a
misconfigured registration fails at startup rather than producing confusing
runtime behavior. `Template`'s constructor *also* clears `this.children` -
a runtime guarantee, so even a Template instance created directly (bypassing
the parser and registry entirely) can't render stray content. Element adds
nothing beyond flipping the default; the two classes exist to make the
constraint self-documenting in a component's own `extends` clause, not
because they need different rendering machinery.

## 11. Attributes: DOM to JavaScript object

Three transformations happen in `Component.parseAttributes()` /
`Component.coerce()`:

- **Reading**: `element.attributes` (a live `NamedNodeMap`) is copied into a
  plain object once, at construction time - not left live, so a component's
  `this.attributes` doesn't mutate out from under it if the DOM node is
  later touched by something else.
- **Case**: HTML attribute names are case-insensitive and always come back
  lower-cased from the DOM, regardless of how they were typed in source -
  `myProp="x"` and `MYPROP="x"` are indistinguishable and both arrive as
  `myprop`. Reactless follows the standard web-components convention:
  author kebab-case in HTML (`my-prop="x"`), and it's converted to camelCase
  (`myProp`) before the component ever sees it.
- **Type coercion**: `"true"`/`"false"` → boolean, numeric strings → number,
  and strings that look like JSON arrays/objects are `JSON.parse`d, with a
  silent fallback to the original string if parsing fails. This is what
  lets `rounded="true"` arrive as a real boolean and
  `links='[{"label":"Home","href":"#"}]'` arrive as a real array with zero
  configuration - see `demo/index.html`'s `Navbar` for a live example.

Parsed attributes are also copied onto the instance directly
(`this.title` as a shortcut for `this.attributes.title`), but only when the
name doesn't collide with an existing method - an attribute literally named
`render` or `mount` is left in `this.attributes` only, with a console
warning, rather than silently clobbering the lifecycle method of the same
name.

## 12. Caching and performance

No virtual DOM, no diffing - this framework never compares an old tree to a
new one; `update()` re-renders a component's own subtree and nothing else.
Three caches do the real work:

- **Loader**: one `<link>` and one `import()` per unique CSS/JS path, ever,
  no matter how many component instances or pages request it, because the
  cache stores the request's Promise rather than gating on a completed
  result.
- **ThemeManager**: one theme-resolution attempt per `component:theme`
  pair - a page with fifty `<Alert>` tags does exactly one fallback
  negotiation for Alert, not fifty.
- **Registry**: descriptors are computed once at `register()` time and
  never recomputed during parsing.

`el.__rlProcessed` (set the instant `Renderer.renderElement` begins, before
any `await`) is what prevents a slow-loading component from being scanned
and rendered twice if `_scanAndRender` happens to reach the same node from
two different recursive paths.

## 13. Edge cases

- **Self-closing custom tags** - the framework's central gotcha; see §3 in
  full.
- **Component names that collide with real HTML elements.** `Button` and
  `Footer` are both real HTML5 tag names (`<button>`, `<footer>`) - and HTML
  tag matching is case-insensitive, so `<Button>` *is* a native `<button>`
  element, not an inert unknown one, until Reactless replaces it. This
  reference implementation hits this deliberately (it's the spec's own
  example name), and it mostly just works - the native element even adds
  free semantics/accessibility in the pending state - but it means the
  hide-until-mounted rule (§3, pass 2) must target only elements the
  registry actually recognizes, scoped via `data-rl-pending`, rather than a
  bare `button { visibility: hidden }` CSS rule, which would incorrectly
  hide *every* plain native button anywhere else on the page, Reactless or
  not.
- **Attribute name case.** Covered in §11 - camelCase attributes are not
  representable in HTML source; document kebab-case as the supported form.
- **Escaping / trust boundary.** `render()` output is inserted via
  `<template>.innerHTML`, so anything a component interpolates unescaped is
  live HTML. `Component.escape()` is provided and used for every
  attribute-sourced text value in the bundled components; `children` is
  deliberately left un-escaped, because it's expected to contain markup
  (including further custom tags) by design. Reactless does not sandbox
  render() beyond this - a component is trusted code, same as any other
  script on the page.
- **Recursive/self-referential rendering.** A theme file whose `render()`
  emits its own tag name would recurse forever. Not specifically guarded
  against today; flagged here as the natural next hardening step (a
  recursion-depth counter in `_scanAndRender`) rather than solved
  speculatively for a case the bundled components never hit.
- **Loading failures.** Missing theme file → fallback to material (§5).
  Missing material file, or a `render()` that throws → the original tag is
  left in place, `data-rl-pending` is removed so it's visible, and an error
  is logged - one broken component never stops the rest of the page from
  rendering, since `_scanAndRender`'s loop `await`s each candidate but
  continues past thrown/caught errors.
- **Dynamic content after initial load.** `Reactless.scan(container)` is
  public specifically so an app that injects HTML later (a modal, a fetched
  partial) can opt a new subtree into parsing without a MutationObserver
  running (and re-scanning) constantly in the background.

## 14. Future-proofing

Nothing below is implemented - this section is a map of where each future
feature attaches to what already exists, not a promise of what it'll look
like:

- **State management / reactive updates / signals** - `Component.update()`
  already exists and already re-renders-in-place via `_rerenderHook`; a
  signals system would just be *what calls* `update()`, not a change to how
  updating itself works.
- **Directives / data binding** - would live as a new pass inside
  `Renderer`, between `render()` producing a string and it being parsed
  into a `<template>` - e.g. scanning the produced fragment for a
  `rl-bind` attribute the way it currently scans for nested component tags.
- **Routing** - a `Template` like any other (`<Router/>`), whose `render()`
  branches on `location.pathname`; `update()` on navigation is enough for a
  first version.
- **SSR** - `render()` already only depends on `this.attributes`/
  `this.children` and returns a plain string; the same component classes
  are already usable in Node as-is; only `Renderer`'s DOM-insertion half is
  browser-only.
- **Plugins** - `Reactless.register()` already accepts an arbitrary
  descriptor; a `Reactless.use(plugin)` entry point would just call known
  hooks (`beforeParse`, `afterRender`) that `Parser`/`Renderer` invoke if
  present, no different in kind from the lifecycle methods components
  already have.
- **Animations / lifecycle hooks** - `mount()`/`destroy()` are already named
  and already the natural place to start/stop a transition; adding
  `beforeUpdate`/`afterUpdate` is additive, not a redesign.
