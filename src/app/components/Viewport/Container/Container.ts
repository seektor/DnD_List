import { Utils } from "../../../utils/Utils";

export class Container {

    private containerElement: HTMLElement;

    constructor() {
        this.constructComponent();
    }

    private constructComponent(): void {
        const containerTemplate: string = require("./container.tpl.html");
        const containerElement: HTMLElement = Utils.createElementFromTemplate(containerTemplate);
        this.containerElement = containerElement;
    }

    public getContainerElement(): HTMLElement {
        return this.containerElement;
    }
}