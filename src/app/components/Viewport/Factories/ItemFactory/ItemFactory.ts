import { Utils } from "../../../../utils/Utils";
import ItemFactoryAttributeHooks from "./structures/ItemFactoryAttributeHooks";
import ItemFactoryClassHooks from "./structures/ItemFactoryClassHooks";

export function ItemFactory(background: string): HTMLElement {
    const itemTemplate: string = require("./item-factory.tpl.html");
    const itemElement: HTMLElement = Utils.createElementFromTemplate(itemTemplate);
    const headerElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.header);
    headerElement.style.background = background;
    return itemElement;
}

export function ItemWithTextFactory(background: string, text: string): HTMLElement {
    const itemElement: HTMLElement = ItemFactory(background);
    const bodyElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.body);
    bodyElement.classList.add(ItemFactoryClassHooks.text);
    bodyElement.innerHTML = `<span>${text}</span>`;
    return itemElement;
}

export function itemWithInputFactory(background: string, text: string, inputBorderColor?: string): HTMLElement {
    const itemElement: HTMLElement = ItemFactory(background);
    const bodyElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.body);
    const input = document.createElement("input");
    input.value = text;
    if (inputBorderColor) {
        input.style.borderColor = inputBorderColor;
    }
    bodyElement.append(input);
    return itemElement;
}