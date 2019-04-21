import { Utils } from "../../utils/Utils";
import { GridDemo } from "../../demos/gridDemos/GridDemo/GridDemo";
import { GridWithToolboxDemo } from "../../demos/gridDemos/GridWithToolboxDemo/GridWithToolboxDemo";

export class Body {

    private bodyElement: HTMLElement;

    constructor(container: HTMLElement) {
        this.constructComponent(container);
        // const listDemo = new ListDemo(this.bodyElement);
        // const gridDemo = new GridDemo(this.bodyElement);
        const gridWithToolboxDemo = new GridWithToolboxDemo(this.bodyElement);
    }

    private constructComponent(container: HTMLElement): void {
        const bodyTemplate: string = require("./body.tpl.html");
        const bodyElement: HTMLElement = Utils.createElementFromTemplate(bodyTemplate);
        this.bodyElement = bodyElement;
        container.append(bodyElement);
    }
}