import { Element } from "../../../core/Element.js";

export default class View extends Element {
  render() {
    const pc_columns = parseInt(this.attributes.columns, 10) || 4;
    const tablet_columns = Math.max(1, Math.floor(pc_columns / 2));
    const mobile_columns = 1;
    const fraction = this.attributes.fraction ?? "1";
    const classes = ["rl-girdview", "rl-gridview--reactless"].join(" ");
    // return `<div class="${classes}" style="grid-template-columns: repeat(${columns}, ${fraction}fr);">${this.children}</div>`;
    return `<div class="${classes}" style="--pc-columns: ${pc_columns}; --tablet-columns: ${tablet_columns}; --mobile-columns: ${mobile_columns}; --grid-fraction: ${fraction}fr;">${this.children}</div>`;
  }
}
