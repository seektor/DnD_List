import { Utils } from "../../../utils/Utils";
import { Container } from "../../Viewport/Container/Container";

export class ListDemo {

    constructor(container: HTMLElement) {
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const bodyTemplate: string = require("./list-demo.tpl.html");
        const bodyElement: HTMLElement = Utils.createElementFromTemplate(bodyTemplate);
        const containerElement: HTMLElement = new Container().getContainerElement();
        bodyElement.append(containerElement);
        container.append(bodyElement);
    }
}