import { Utils } from "../../utils/Utils";

export class Grid {

    constructor(container: HTMLElement) {
        this.constructComponent(container);
    }

    private constructComponent(conmtainer: HTMLElement) {
        const gridTemplate: string = require("./grid.tpl.html");
        const gridElement: HTMLElement = Utils.createElementFromTemplate(gridTemplate);
        conmtainer.append(gridElement);
    }
}