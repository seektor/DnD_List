import { Utils } from "../../../../utils/Utils";
import ItemFactoryAttributeHooks, { TItemFactoryAttributeHooks } from "./structures/ItemFactoryAttributeHooks";

export function ItemFactory(color: string): HTMLElement {
    const itemTemplate: string = require("./item-factory.tpl.html");
    const itemElement: HTMLElement = Utils.createElementFromTemplate(itemTemplate);
    const headerElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.header);
    const avatarElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.avatar);
    headerElement.style.backgroundColor = color;
    avatarElement.style.backgroundColor = color;
    return itemElement;
}