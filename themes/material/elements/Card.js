import { Element } from "../../../core/Element.js";

export default class Card extends Element {
  render() {
    const title = this.attributes.title
      ? `<h3 class="rl-card__title">${this.escape(this.attributes.title)}</h3>`
      : "";
    const subtitle = this.attributes.subtitle
      ? `<h3 class="rl-card__subtitle">${this.escape(this.attributes.subtitle)}</h3>`
      : "";
    return `
      <div class="rl-card rl-card--material">
        ${title}
        ${subtitle}
        <div class="rl-card__body">${this.children}</div>
      </div>`;
  }
}
