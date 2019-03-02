export class Toolbox {

    constructor(container: HTMLElement) {
        this.construct(container);
    }

    public construct(container: HTMLElement) {
        const toolboxWrapper: HTMLElement = document.createElement("div");
        toolboxWrapper.classList.add("toolbox__wrapper");
        const itemTemplate: string = require("../templates/item.tpl.html");
        const itemElement: DocumentFragment = document.createRange().createContextualFragment(itemTemplate);
        const titleElement: HTMLElement = itemElement.querySelector("[item__title]");
        titleElement.innerHTML = "Drag Me";
        toolboxWrapper.appendChild(itemElement);
        container.appendChild(toolboxWrapper);
    }
}