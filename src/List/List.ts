// import { TListParams } from "./interfaces/TListParams";
// import { Utils } from "../common/utils/Utils";
// import { ListItemFactory } from "./factories/ListItemFactory/ListItemFactory";
// import ListAttributeHooks from "./structures/ListAttributeHooks";
// import listItemAttributeHooks from "./factories/ListItemFactory/structures/listItemAttributeHooks";

// export class List {

//     private itemsListElement: HTMLElement;

//     private itemMarginBottom: number;

//     constructor(container: HTMLElement, params: TListParams) {
//         this.constructComponent(container);
//         this.processParams(params);
//     }

//     private processParams(params: TListParams) {
//         this.itemMarginBottom = params.itemMarginBottom;
//     }

//     private constructComponent(container: HTMLElement): void {
//         const listTemplate: string = require("./list.tpl.html");
//         const listElement: HTMLElement = Utils.createElementFromTemplate(listTemplate);
//         this.itemsListElement = Utils.getElementByAttribute(listElement, ListAttributeHooks.itemsList);
//         container.append(listElement);
//     }

//     public addItem(content: HTMLElement): void {
//         const itemElement: HTMLElement = this.createItemElement(content);
//         this.itemsListElement.append(itemElement);
//     }

//     private createItemElement(contentElement: HTMLElement): HTMLElement {
//         const listItem: HTMLElement = ListItemFactory();
//         listItem.style.marginBottom = `${this.itemMarginBottom}px`;
//         const dragAnchorElement: HTMLElement | undefined = Utils.getElementByAttribute(contentElement, listItemAttributeHooks.dragAnchor);
//         const clickAnchorElement: HTMLElement | undefined = Utils.getElementByAttribute(contentElement, listItemAttributeHooks.clickAnchor);
//         listItem.append(contentElement);
//         // itemAnchorElement.addEventListener(
//         //     'mousedown',
//         //     (event: MouseEvent) => this.onActionDown(event, DragMode.Internal)
//         // );
//         // clonedItemElement.addEventListener('mouseenter', this.onDragEnter);
//         // clonedItemElement.appendChild(contentElement);
//         return listItem;
//     }
// }