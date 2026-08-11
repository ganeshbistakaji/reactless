import { Template } from "../../../core/Template.js";

export default class Navbar extends Template {
  constructor(props) {
    super(props);
    this._bound = false;
  }

  render() {
    const brandData = this.attributes.brand;

    console.log(brandData);

    const brandText = this.escape(brandData.brandText || "Reactless");
    const brandImage = this.escape(brandData.brandImage || "");
    const brandAlt = this.escape(brandData.brandAlt || "Brand Logo");

    let brandContent = "";
    if (brandImage) {
      brandContent = `<img src="${brandImage}" alt="${brandAlt || "Brand Logo"}" class="rl-navbar-brand-image--reactless" />`;
    } else if (brandText) {
      brandContent = `<span class="rl-navbar-brand-text--reactless">${brandText}</span>`;
    }

    const menus = Array.isArray(this.attributes.menus)
      ? this.attributes.menus
      : [];
    const items = menus
      .map(
        (l) =>
          `<li><a class="rl-navbar-link--reactless" href="${this.escape(l.link ?? "#")}">${this.escape(l.menu ?? "")}</a></li>`,
      )
      .join("");

    const primaryButton = this.attributes.primarybutton;
    const primaryButtonHtml =
      primaryButton && primaryButton.name
        ? `<li><a class="rl-navbar-cta-primary--reactless" href="${this.escape(primaryButton.link ?? "#")}">${this.escape(primaryButton.name)}</a></li>`
        : "";

    const menuLinks = items + primaryButtonHtml;

    const secondaryButton = this.attributes.secondarybutton;
    const secondaryButtonHtml =
      secondaryButton && secondaryButton.name
        ? `<a class="rl-navbar-cta-secondary--reactless" href="${this.escape(secondaryButton.link ?? "#")}">${this.escape(secondaryButton.name)}</a>`
        : "";

    return `
    <nav class="rl-navbar rl-navbar--reactless">
      <div class="rl-navbar-container--reactless">
        <a class="rl-navbar-brand--reactless" href="/">
          ${brandContent}
        </a>
        <div class="rl-navbar-inner--reactless">
          <button class="rl-navbar-hamburger--reactless">
            <svg
          width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M27 18C27 18.1989 26.921 18.3897 26.7803 18.5303C26.6397 18.671 26.4489 18.75 26.25 18.75H9.75C9.55109 18.75 9.36032 18.671 9.21967 18.5303C9.07902 18.3897 9 18.1989 9 18C9 17.8011 9.07902 17.6103 9.21967 17.4697C9.36032 17.329 9.55109 17.25 9.75 17.25H26.25C26.4489 17.25 26.6397 17.329 26.7803 17.4697C26.921 17.6103 27 17.8011 27 18ZM9.75 12.75H26.25C26.4489 12.75 26.6397 12.671 26.7803 12.5303C26.921 12.3897 27 12.1989 27 12C27 11.8011 26.921 11.6103 26.7803 11.4697C26.6397 11.329 26.4489 11.25 26.25 11.25H9.75C9.55109 11.25 9.36032 11.329 9.21967 11.4697C9.07902 11.6103 9 11.8011 9 12C9 12.1989 9.07902 12.3897 9.21967 12.5303C9.36032 12.671 9.55109 12.75 9.75 12.75ZM26.25 23.25H9.75C9.55109 23.25 9.36032 23.329 9.21967 23.4697C9.07902 23.6103 9 23.8011 9 24C9 24.1989 9.07902 24.3897 9.21967 24.5303C9.36032 24.671 9.55109 24.75 9.75 24.75H26.25C26.4489 24.75 26.6397 24.671 26.7803 24.5303C26.921 24.3897 27 24.1989 27 24C27 23.8011 26.921 23.6103 26.7803 23.4697C26.6397 23.329 26.4489 23.25 26.25 23.25Z"
          fill="white"
        />
      </svg>
          </button>
          <ul class="rl-navbar-links--reactless rl-navbar-links-menu-inactive--reactless">
            ${menuLinks}
          </ul>
          ${secondaryButtonHtml}
        </div>
      </div>
    </nav>`;
  }

  mount(el) {
    super.mount(el);
    if (!el || this._bound) return;
    this._bound = true;

    const ham = el.querySelector(".rl-navbar-hamburger--reactless");
    const menu = el.querySelector(".rl-navbar-links--reactless");
    if (!ham || !menu) return;

    ham.addEventListener("click", (event) => {

      const hamburgerSvg = `<svg
          width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M27 18C27 18.1989 26.921 18.3897 26.7803 18.5303C26.6397 18.671 26.4489 18.75 26.25 18.75H9.75C9.55109 18.75 9.36032 18.671 9.21967 18.5303C9.07902 18.3897 9 18.1989 9 18C9 17.8011 9.07902 17.6103 9.21967 17.4697C9.36032 17.329 9.55109 17.25 9.75 17.25H26.25C26.4489 17.25 26.6397 17.329 26.7803 17.4697C26.921 17.6103 27 17.8011 27 18ZM9.75 12.75H26.25C26.4489 12.75 26.6397 12.671 26.7803 12.5303C26.921 12.3897 27 12.1989 27 12C27 11.8011 26.921 11.6103 26.7803 11.4697C26.6397 11.329 26.4489 11.25 26.25 11.25H9.75C9.55109 11.25 9.36032 11.329 9.21967 11.4697C9.07902 11.6103 9 11.8011 9 12C9 12.1989 9.07902 12.3897 9.21967 12.5303C9.36032 12.671 9.55109 12.75 9.75 12.75ZM26.25 23.25H9.75C9.55109 23.25 9.36032 23.329 9.21967 23.4697C9.07902 23.6103 9 23.8011 9 24C9 24.1989 9.07902 24.3897 9.21967 24.5303C9.36032 24.671 9.55109 24.75 9.75 24.75H26.25C26.4489 24.75 26.6397 24.671 26.7803 24.5303C26.921 24.3897 27 24.1989 27 24C27 23.8011 26.921 23.6103 26.7803 23.4697C26.6397 23.329 26.4489 23.25 26.25 23.25Z"
          fill="white"
        />
      </svg>`;
      const closeSvg = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M25.2806 24.2194C25.3502 24.289 25.4055 24.3718 25.4432 24.4628C25.4809 24.5539 25.5003 24.6514 25.5003 24.75C25.5003 24.8485 25.4809 24.9461 25.4432 25.0372C25.4055 25.1282 25.3502 25.2109 25.2806 25.2806C25.2109 25.3503 25.1281 25.4056 25.0371 25.4433C24.9461 25.481 24.8485 25.5004 24.7499 25.5004C24.6514 25.5004 24.5538 25.481 24.4628 25.4433C24.3717 25.4056 24.289 25.3503 24.2193 25.2806L17.9999 19.0603L11.7806 25.2806C11.6398 25.4213 11.449 25.5004 11.2499 25.5004C11.0509 25.5004 10.86 25.4213 10.7193 25.2806C10.5786 25.1399 10.4995 24.949 10.4995 24.75C10.4995 24.551 10.5786 24.3601 10.7193 24.2194L16.9396 18L10.7193 11.7806C10.5786 11.6399 10.4995 11.449 10.4995 11.25C10.4995 11.051 10.5786 10.8601 10.7193 10.7194C10.86 10.5786 11.0509 10.4996 11.2499 10.4996C11.449 10.4996 11.6398 10.5786 11.7806 10.7194L17.9999 16.9397L24.2193 10.7194C24.36 10.5786 24.5509 10.4996 24.7499 10.4996C24.949 10.4996 25.1398 10.5786 25.2806 10.7194C25.4213 10.8601 25.5003 11.051 25.5003 11.25C25.5003 11.449 25.4213 11.6399 25.2806 11.7806L19.0602 18L25.2806 24.2194Z" fill="white"/>
</svg>
`;

      const isActive = menu.classList.toggle(
        "rl-navbar-links-menu-inactive--reactless",
      );
      menu.classList.toggle("rl-navbar-links-menu-active--reactless");

      ham.innerHTML = isActive ? hamburgerSvg : closeSvg;
    });
  }
}
