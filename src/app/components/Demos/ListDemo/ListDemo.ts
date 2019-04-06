import { Utils } from "../../../utils/Utils";
import { ContainerFactory } from "../../Viewport/Factories/ContainerFactory/ContainerFactory";

export class ListDemo {

    constructor(container: HTMLElement) {
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const listTemplate: string = require("./list-demo.tpl.html");
        const listElement: HTMLElement = Utils.createElementFromTemplate(listTemplate);
        const containerElement: HTMLElement = ContainerFactory();
        listElement.append(containerElement);
        container.append(listElement);
    }
}