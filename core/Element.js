import { Component } from './Component.js';

/**
 * Element - a reusable UI building block (Button, Card, Alert, ...).
 * Unlike Template, Elements may allow authored children (configurable at
 * registration time via `allowChildren`) and may be nested inside each
 * other, inside a Template's own render() output, or inside plain HTML.
 * `children` holds the original, *unrendered* innerHTML string; Renderer
 * re-scans it after insertion so any custom tags inside it are discovered
 * and processed too (see Renderer.js and Parser._scanAndRender).
 */
export class Element extends Component {
  static defaultAllowChildren = true;
  static defaultSelfClosing = false;
}
