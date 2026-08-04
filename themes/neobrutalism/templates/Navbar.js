import { Template } from '../../../core/Template.js';

export default class Navbar extends Template {
  render() {
    const brand = this.escape(this.attributes.brand ?? 'REACTLESS');
    const links = Array.isArray(this.attributes.links) ? this.attributes.links : [];
    const items = links
      .map((l) => `<li><a class="rl-navbar__link" href="${this.escape(l.href ?? '#')}">${this.escape(l.label ?? '')}</a></li>`)
      .join('');
    return `
      <nav class="rl-navbar rl-navbar--neobrutalism">
        <span class="rl-navbar__brand">${brand}</span>
        <ul class="rl-navbar__links">${items}</ul>
      </nav>`;
  }
}
