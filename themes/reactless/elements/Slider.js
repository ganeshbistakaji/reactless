import { Element } from "../../../core/Element.js";

export default class Slider extends Element {
  render() {
    const amount = this.attributes.amount || 4;

    // const infinite =
    //   this.attributes.infinite !== undefined &&
    //   this.attributes.infinite !== false;

    const finalAmount = parseInt(amount) + 0.15;

    const template = document.createElement("template");
    template.innerHTML = String(this.children || "").trim();

    const cardNodes = Array.from(template.content.children);

    const listItems = cardNodes
      .map(
        (card) =>
          `<li class="rl-slider-item--reactless">${card.outerHTML}</li>`,
      )
      .join("");

    return `
      <div class="rl-slider--reactless"  style="--item-amount: ${finalAmount};">
        <div class="rl-slider-nav-buttons--reactless">
          <button class="rl-slider-nav-left--reactless">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="#000000"
              viewBox="0 0 256 256"
            >
              <path
                d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"
              ></path>
            </svg>
          </button>
          <button class="rl-slider-nav-right--reactless">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="#000000"
              viewBox="0 0 256 256"
            >
              <path
                d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"
              ></path>
            </svg>
          </button>
        </div>
        <ul class="rl-slider-wrapper--reactless">
          ${listItems}
        </ul>
      </div>`;
  }

  mount(el) {
    super.mount(el);
    if (!el || this._bound) return;
    this._bound = true;

    const slider = el.querySelector(".rl-slider-wrapper--reactless");
    const leftBtn = el.querySelector(".rl-slider-nav-left--reactless");
    const rightBtn = el.querySelector(".rl-slider-nav-right--reactless");

    if (!slider || !leftBtn || !rightBtn) return;

    const getScrollAmount = () => {
      const card = slider.querySelector(".rl-slider-item--reactless");
      if (!card) return 300;

      const cardWidth = card.getBoundingClientRect().width;
      const gap = parseFloat(window.getComputedStyle(slider).gap) || 16;

      return cardWidth + gap;
    };

    rightBtn.addEventListener("click", () => {
      slider.scrollTo({
        left: slider.scrollLeft + getScrollAmount(),
        behavior: "smooth",
      });
    });

    leftBtn.addEventListener("click", () => {
      slider.scrollTo({
        left: slider.scrollLeft - getScrollAmount(),
        behavior: "smooth",
      });
    });
  }
}
