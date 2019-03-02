export class List {

    constructor(container: HTMLElement) {
        this.construct(container);
    }

    public construct(container: HTMLElement) {
        const listWrapper: HTMLElement = document.createElement("div");
        listWrapper.classList.add("list__wrapper");
        const itemTemplate: string = require("../templates/item.tpl.html");
        const itemElement: DocumentFragment = document.createRange().createContextualFragment(itemTemplate);
        const items: HTMLElement[] = [];
        for (let i = 0; i <= 5; i++) {
            const clonedItem: HTMLElement = itemElement.cloneNode(true) as HTMLElement;
            const titleElement: HTMLElement = clonedItem.querySelector("[item__title]");
            titleElement.innerHTML = `Item ${i}`;
            items.push(clonedItem);
        }
        listWrapper.append(...items);
        container.appendChild(listWrapper);
    }
}