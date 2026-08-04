import { Element } from '../../../core/Element.js';

export default class Pressable extends Element {
  render() {
    const color = this.attributes.color ?? 'primary';
    const disabled = this.attributes.disabled === true;
    const classes = ['rl-btn', 'rl-btn--neobrutalism', `rl-btn--${color}`].join(' ');
    return `<button type="button" class="${classes}"${disabled ? ' disabled' : ''}>${this.children} <span class="rl-btn__arrow">↗</span></button>`;
  }

  mount(el) {
    super.mount(el);
    if (!el) return;
    el.addEventListener('click', () => {
      el.dispatchEvent(new CustomEvent('rl-click', { bubbles: true, detail: { name: this.name, theme: this.theme } }));
    });
  }
}
