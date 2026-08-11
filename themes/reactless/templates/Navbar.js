import { Template } from "../../../core/Template.js";

export default class Navbar extends Template {
  constructor(props) {
    super(props);
    this._bound = false;
  }

  render() {
    const brandText = this.escape(this.attributes.brandtext ?? "");
    const brandImage = this.escape(this.attributes.brandimage ?? "");
    const brandAlt = this.escape(this.attributes.brandalt ?? "");

    let brandContent = "";
    if (brandImage) {
      brandContent = `<img src="${brandImage}" alt="${brandAlt || "Brand Logo"}" class="rl-navbar__brand-image" />`;
    } else if (brandText) {
      brandContent = `<span class="rl-navbar-brand-text--reactless">${brandText}</span>`;
    }

    // `links` arrives as a real array already — Component.coerce() parsed
    // the JSON attribute string for us before render() ever ran.
    const menus = Array.isArray(this.attributes.menus)
      ? this.attributes.menus
      : [];
    const items = menus
      .map(
        (l) =>
          `<li><a class="rl-navbar__link" href="${this.escape(l.link ?? "#")}">${this.escape(l.menu ?? "")}</a></li>`,
      )
      .join("");
    return `
      <nav class="rl-navbar rl-navbar--material">
      <a class="rl-navbar__brand" href="#">${brandContent}</a>  
        <ul class="rl-navbar__links">${items}</ul>
        <button class="custom-button">dsf</button>
      </nav>`;
  }

  mount(el) {
    super.mount(el);
    if (!el || this._bound) return;
    this._bound = true;

    const button = el.querySelector(".custom-button");
    if (!button) return;

    button.addEventListener("click", (event) => {});
  }
}

// import { Template } from '../../../core/Template.js';

// export default class Navbar extends Template {
//   render() {
//     const brandText = this.escape(this.attributes.brand ?? 'Reactless');
//     // `links` arrives as a real array already — Component.coerce() parsed
//     // the JSON attribute string for us before render() ever ran.
//     const menus = Array.isArray(this.attributes.menus) ? this.attributes.menus : [];
//     const items = menus
//       .map((l) => `<li><a class="rl-navbar__link" href="${this.escape(l.link ?? '#')}">${this.escape(l.menu ?? '')}</a></li>`)
//       .join('');
//     return `
//       <nav class="rl-navbar rl-navbar--material">
//         <span class="rl-navbar__brand">${brand}</span>
//         <ul class="rl-navbar__links">${items}</ul>
//       </nav>`;
//   }
// }
