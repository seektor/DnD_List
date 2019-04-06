import { Utils } from "../../../utils/Utils";
import { ContainerFactory } from "../../Viewport/Factories/ContainerFactory/ContainerFactory";

export class ListDemo {

    constructor(container: HTMLElement) {
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const bodyTemplate: string = require("./list-demo.tpl.html");
        const bodyElement: HTMLElement = Utils.createElementFromTemplate(bodyTemplate);
        const containerElement: HTMLElement = ContainerFactory();
        bodyElement.append(containerElement);
        container.append(bodyElement);
    }
}