import { Utils } from "../../../../utils/Utils";

export function ToolboxItemFactory(title: string) {
    const template: string = require("./toolbox-item-factory.tpl.html");
    const itemElement: HTMLElement = Utils.createElementFromTemplate(template);
    itemElement.innerHTML = title;
    return itemElement;
}