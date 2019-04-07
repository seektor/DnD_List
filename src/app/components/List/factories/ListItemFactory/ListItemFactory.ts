import { Utils } from "../../../../utils/Utils";

export function ListItemFactory(): HTMLElement {
    const listItemTemplate: string = require("./list-item-factory.tpl.html");
    const listItemElement: HTMLElement = Utils.createElementFromTemplate(listItemTemplate);
    return listItemElement;
}