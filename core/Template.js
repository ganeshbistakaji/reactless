import { Component } from './Component.js';

/**
 * Template - a complete, self-contained page section (Hero, Navbar, Footer,
 * Features, ...). Templates never accept authored children: registering a
 * component with type "Template" implies allowChildren:false unless
 * explicitly overridden (and Registry will refuse the override - see
 * Registry.js).
 *
 * By the time a Template is constructed, Parser.reflowVoidComponents() has
 * already guaranteed there is nothing nested inside it - any markup an
 * author's self-closing tag accidentally swallowed (a real HTML-parsing
 * quirk, not a Reactless bug; see ARCHITECTURE.md, "Self-closing custom
 * tags") has been moved back out to the surrounding document. `children`
 * here should always be empty; the guard below is a last line of defence
 * for anyone constructing a Template directly, bypassing the Parser.
 */
export class Template extends Component {
  static defaultAllowChildren = false;
  static defaultSelfClosing = true;

  constructor(options) {
    super(options);
    if (this.children && this.children.trim().length > 0) {
      console.warn(`[Reactless] <${this.name}> is a Template and cannot contain children; unexpected content will be ignored by render().`);
    }
    this.children = '';
  }
}
