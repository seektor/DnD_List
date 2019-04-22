import { Utils } from '../../../utils/Utils';
import ItemFactoryAttributeHooks from './structures/ItemFactoryAttributeHooks';
import ItemFactoryClassHooks from './structures/ItemFactoryClassHooks';

export class ItemFactory {

    private static Item(firstHeaderColor: string, secondHeaderColor: string = null): HTMLElement {
        const itemTemplate: string = require('./item-factory.tpl.html');
        const itemElement: HTMLElement = Utils.createElementFromTemplate(itemTemplate);
        const headerElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.header);
        headerElement.style.background = secondHeaderColor ? Utils.createLinearGradient(firstHeaderColor, secondHeaderColor, 90) : firstHeaderColor;
        return itemElement;
    }

    public static DarkItemWithText(text: string): HTMLElement {
        const item: HTMLElement = this.ItemWithText(text, '#212121', '#212121');
        item.classList.add(ItemFactoryClassHooks.dark);
        return item;
    }

    public static InvertedItem(firstBodyColor: string, secondBodyColor: string = null): HTMLElement {
        const item: HTMLElement = this.Item('ffffff');
        const bodyElement: HTMLElement = Utils.getElementByAttribute(item, ItemFactoryAttributeHooks.body);
        bodyElement.style.background = secondBodyColor ? Utils.createLinearGradient(firstBodyColor, secondBodyColor, 0) : firstBodyColor;
        return item;
    }

    public static ItemWithText(text: string, firstBodyColor: string, secondBodyColor: string = null): HTMLElement {
        const itemElement: HTMLElement = this.Item(firstBodyColor, secondBodyColor);
        const bodyElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.body);
        bodyElement.classList.add(ItemFactoryClassHooks.text);
        bodyElement.innerHTML = `<span>${text}</span>`;
        return itemElement;
    }

    public static ItemWithInput(text: string, firstBodyColor: string, secondBodyColor: string = null, inputBorderColor: string = null): HTMLElement {
        const itemElement: HTMLElement = this.Item(firstBodyColor, secondBodyColor);
        const bodyElement: HTMLElement = Utils.getElementByAttribute(itemElement, ItemFactoryAttributeHooks.body);
        const input = document.createElement('input');
        input.value = text;
        if (inputBorderColor) {
            input.style.borderColor = inputBorderColor;
        }
        bodyElement.append(input);
        return itemElement;
    }

}