import { Template } from '../../../core/Template.js';

export default class Footer extends Template {
  render() {
    const year = this.attributes.year ?? new Date().getFullYear();
    const text = this.escape(this.attributes.text ?? '');
    return `
      <footer class="rl-footer rl-footer--neobrutalism">
        <p class="rl-footer__text">${this.escape(String(year))} — ${text}</p>
      </footer>`;
  }
}
