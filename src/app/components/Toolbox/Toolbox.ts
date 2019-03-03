import ItemAttributeHooks, { TItemAttributeHooks } from "../templates/item/structures/ItemAttributeHooks";
import ToolboxClassHooks, { TToolboxClassHooks } from "./structures/ToolboxClassHooks";

export class Toolbox {

    private readonly itemAttributeHooks: TItemAttributeHooks = ItemAttributeHooks;
    private readonly toolboxClassHooks: TToolboxClassHooks = ToolboxClassHooks;

    constructor(container: HTMLElement) {
        this.constructComponent(container);
    }

    private constructComponent(container: HTMLElement) {
        const toolboxWrapper: HTMLElement = document.createElement("div");
        toolboxWrapper.classList.add(this.toolboxClassHooks.toolboxWrapper);
        const itemTemplate: string = require("../templates/item/item.tpl.html");
        const itemElement: DocumentFragment = document.createRange().createContextualFragment(itemTemplate);
        const titleElement: HTMLElement = itemElement.querySelector(`[${this.itemAttributeHooks.itemTitle}]`);
        titleElement.innerHTML = "Drag Me";
        toolboxWrapper.appendChild(itemElement);
        container.appendChild(toolboxWrapper);
    }
}