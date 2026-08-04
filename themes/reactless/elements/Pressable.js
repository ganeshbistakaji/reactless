import { Element } from "../../../core/Element.js";

export default class Pressable extends Element {
  render() {
    const tab =
      this.attributes.newtab !== undefined && this.attributes.newtab !== false;
    const classes = ["rl-btn", "rl-btn--reactless"].join(" ");
    return `<a href="${this.attributes.link ?? "#"}" target="${tab ? "_blank" : "_self"}" class="${classes}">${this.children}</a>`;
  }

  mount(el) {
    super.mount(el);
    if (!el) return;
    el.addEventListener("click", () => {
      el.dispatchEvent(
        new CustomEvent("rl-click", {
          bubbles: true,
          detail: { name: this.name, theme: this.theme },
        }),
      );
    });
  }
}
