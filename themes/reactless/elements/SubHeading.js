import { Element } from "../../../core/Element.js";

export default class SubHeading extends Element {
  render() {
    const fullscreen =
      this.attributes.full !== undefined && this.attributes.full !== false;
    const classes = ["rl-subheading", "rl-subheading--reactless"].join(" ");
    return `<h2 class="${classes}">${this.children}</h2>`;
  }
}
