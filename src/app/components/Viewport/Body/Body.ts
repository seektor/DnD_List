import { Utils } from "../../../utils/Utils";
import { ListDemo } from "../../Demos/ListDemo/ListDemo";

export class Body {

    private bodyElement: HTMLElement;

    constructor(container: HTMLElement) {
        this.constructComponent(container);
        const listDemo = new ListDemo(this.bodyElement);
    }

    private constructComponent(container: HTMLElement): void {
        const bodyTemplate: string = require("./body.tpl.html");
        const bodyElement: HTMLElement = Utils.createElementFromTemplate(bodyTemplate);
        this.bodyElement = bodyElement;
        container.append(bodyElement);
    }
}