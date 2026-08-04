import { Element } from "../../../core/Element.js";

export default class View extends Element {
  render() {
    const fullscreen =
      this.attributes.full !== undefined && this.attributes.full !== false;
    const classes = [
      "rl-view",
      "rl-view--reactless",
      `rl-view--${fullscreen ? "fullscreen" : "boxed"}`,
    ].join(" ");
    return `<div class="${classes}">${this.children}</div>`;
  }
}
 