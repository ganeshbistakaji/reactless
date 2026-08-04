import { Element } from '../../../core/Element.js';

export default class Alert extends Element {
  render() {
    const type = this.attributes.type ?? 'info';
    const dismissible = this.attributes.dismissible === true;
    return `
      <div class="rl-alert rl-alert--material rl-alert--${type}" role="status">
        <span class="rl-alert__message">${this.children}</span>
        ${dismissible ? '<button type="button" class="rl-alert__close" aria-label="Dismiss">&times;</button>' : ''}
      </div>`;
  }

  mount(el) {
    super.mount(el);
    if (!el) return;
    const closeBtn = el.querySelector('.rl-alert__close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.destroy());
  }
}
