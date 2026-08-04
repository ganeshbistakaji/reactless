import { Element } from '../../../core/Element.js';

export default class Pressable extends Element {
  render() {
    const color = this.attributes.color ?? 'primary';
    const rounded = this.attributes.rounded === true; // coerced from "true"/"false" by Component.coerce()
    const disabled = this.attributes.disabled === true;
    const classes = ['rl-btn', 'rl-btn--material', `rl-btn--${color}`, rounded ? 'rl-btn--rounded' : '']
      .filter(Boolean)
      .join(' ');
    // `this.children` is left un-escaped and un-modified on purpose: it's
    // the original innerHTML, which may itself contain further custom tags
    // that Renderer will recursively discover and process after insertion.
    return `<button type="button" class="${classes}"${disabled ? ' disabled' : ''}>${this.children}</button>`;
  }

  mount(el) {
    super.mount(el);
    if (!el) return;
    el.addEventListener('click', () => {
      el.dispatchEvent(new CustomEvent('rl-click', { bubbles: true, detail: { name: this.name, theme: this.theme } }));
    });
  }
}
