import { Utils } from "../../../../utils/Utils";
import ItemFactoryAttributeHooks from "./structures/ItemFactoryAttributeHooks";

export function ItemFactory(color: string): HTMLElement {
    const itemTemplate: string = require("./item-factory.tpl.html");
    const itemElement: HTMLElement = Utils.createElementFromTemplate(itemTemplate);
    const headerElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.header);
    const avatarElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.avatar);
    headerElement.style.backgroundColor = color;
    avatarElement.style.backgroundColor = color;
    return itemElement;
}

export function ItemWithTextFactory(color: string, text: string): HTMLElement {
    const itemElement: HTMLElement = ItemFactory(color);
    const bodyElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.content);
    bodyElement.innerHTML = text;
    return itemElement;
}

export function itemWithInputFactory(color: string, text: string): HTMLElement {
    const itemElement: HTMLElement = ItemFactory(color);
    const bodyElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.content);
    const input = document.createElement("input");
    input.value = text;
    bodyElement.append(input);
    return itemElement;
}