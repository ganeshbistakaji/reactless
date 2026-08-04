import { Element } from "../../../core/Element.js";

export default class Card extends Element {
  render() {
    const title = this.attributes.title ?? "This is a demo title";

    const description =
      this.attributes.description ??
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam malesuada pellentesque malesuada. Nunc vel efficitur lacus, ut bibendum massa. Cras bibendum ante dolor, vel rhoncus leo faucibus ut. Curabitur porta sed velit id mollis. Sed vehicula eros nec ornare lacinia. Proin nunc erat, vulputate congue dictum vitae, vulputate ac libero. Suspendisse ac felis tempor, blandit erat vel, porta eros. Proin rutrum justo quis iaculis sagittis. Nullam suscipit lectus non ligula rutrum venenatis. Duis sed justo leo. Fusce ac ullamcorper mauris. Nunc convallis orci ut ligula fermentum, eu maximus sem tristique. Proin et diam velit.";

    const char = parseInt(this.attributes.char, 10) || 1000;

    const truncatedDesc =
      description.length > char
        ? description.slice(0, char) + "..."
        : description;

    const image = this.attributes.image;

    const ctaname = this.attributes.ctaname;

    const ctalink = this.attributes.ctalink ?? "#";

    const tab =
      this.attributes.newtab !== undefined && this.attributes.newtab !== false;

    return `
      <div class="rl-card rl-card--reactless">
        ${image ? `<img class="rl-card-image--reactless" src="${image}">` : ""}
        <div class="rl-card-textbox--reactless">
            <Title>${title}</Title>
            <p class="rl-card-paragraph--reactless">${truncatedDesc}</p>
        </div>
        ${ctaname ? `<Pressable link="${ctalink}" ${tab ? "newtab" : ""}>${ctaname}</Pressable>` : ""}
      </div>`;
  }
}
