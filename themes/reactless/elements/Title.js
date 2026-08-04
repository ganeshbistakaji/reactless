import { Element } from "../../../core/Element.js";

export default class Title extends Element {
  render() {
    const fullscreen =
      this.attributes.full !== undefined && this.attributes.full !== false;
    const classes = ["rl-title", "rl-title--reactless"].join(" ");
    return `<h3 class="${classes}">${this.children}</h3>`;
  }
}
