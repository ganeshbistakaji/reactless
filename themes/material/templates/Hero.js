import { Template } from '../../../core/Template.js';

export default class Hero extends Template {
  render() {
    const title = this.escape(this.attributes.title ?? '');
    const content = this.escape(this.attributes.content ?? '');
    return `
      <section class="rl-hero rl-hero--material">
        <div class="rl-hero__inner">
          <h1 class="rl-hero__title">${title}</h1>
          <p class="rl-hero__content">${content}</p>
        </div>
      </section>`;
  }
}
