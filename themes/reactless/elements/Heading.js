import { Element } from "../../../core/Element.js";

export default class Heading extends Element {
  render() {
    const fullscreen =
      this.attributes.full !== undefined && this.attributes.full !== false;
    const classes = ["rl-heading", "rl-heading--reactless"].join(" ");
    const content = this.attributes.content
    return `<h1 class="${classes}">${this.children}</h1>`;
  }
}
