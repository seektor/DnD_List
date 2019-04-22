import { ItemFactory } from "../../viewport/Factories/ItemFactory/ItemFactory";
import ItemFactoryAttributeHooks from "../../viewport/Factories/ItemFactory/structures/ItemFactoryAttributeHooks";
import { Utils } from "../../utils/Utils";
import GridAttributeHooks from "../../components/Grid/structures/GridAttributeHooks";

export class AbstractGridDemo {

    protected createPureItem(text: string, gradientColors: string[]): HTMLElement {
        const item: HTMLElement = ItemFactory.ItemWithText(text, gradientColors[0], gradientColors[1]);
        const itemHeader: HTMLElement = Utils.getElementByAttribute(item, ItemFactoryAttributeHooks.header);
        itemHeader.setAttribute(GridAttributeHooks.itemDragAnchor, '');
        itemHeader.style.cursor = 'grab';
        return item;
    }

    protected createPureDarkItem(text: string): HTMLElement {
        const item: HTMLElement = ItemFactory.DarkItemWithText(text);
        const itemHeader: HTMLElement = Utils.getElementByAttribute(item, ItemFactoryAttributeHooks.header);
        itemHeader.setAttribute(GridAttributeHooks.itemDragAnchor, '');
        itemHeader.style.cursor = 'grab';
        return item;
    }

    protected createClassItem(text: string, gradientColors: string[], rowspan: number, colspan: number): HTMLElement {
        const item = this.createPureItem(text, gradientColors);
        const classNames: string[] = this.createClassNames(rowspan, colspan);
        item.classList.add(...classNames);
        return item;
    }

    protected createClassNames(rowspan: number, colspan: number): [string, string] {
        return [`grid-height-screen-${rowspan}`, `grid-width-screen-${colspan}`];
    }
}