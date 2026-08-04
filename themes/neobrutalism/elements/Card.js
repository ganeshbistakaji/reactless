import { Element } from '../../../core/Element.js';

export default class Card extends Element {
  render() {
    const title = this.attributes.title
      ? `<h3 class="rl-card__title">${this.escape(this.attributes.title)}</h3>`
      : '';
    return `
      <div class="rl-card rl-card--neobrutalism">
        <span class="rl-card__tag">CARD</span>
        ${title}
        <div class="rl-card__body">${this.children}</div>
      </div>`;
  }
}
