import { Utils } from '../../../../utils/Utils';
import ToolboxItemAttributeHooks from './structures/ToolboxItemAttributeHooks';

export function ToolboxItemFactory(title: string): HTMLElement {
    const template: string = require('./toolbox-item-factory.tpl.html');
    const itemElement: HTMLElement = Utils.createElementFromTemplate(template);
    const textElement: HTMLElement = Utils.getElementByAttribute(itemElement, ToolboxItemAttributeHooks.text);
    textElement.innerHTML = title;
    return itemElement;
}