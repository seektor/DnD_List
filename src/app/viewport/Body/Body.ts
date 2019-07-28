import { Utils } from '../../../common/utils/Utils';
import { GridWithToolboxDemo } from '../../demos/gridDemos/GridWithToolboxDemo/GridWithToolboxDemo';

export class Body {

    private bodyElement: HTMLElement;

    constructor(container: HTMLElement) {
        this.constructComponent(container);
        const gridWithToolboxDemo = new GridWithToolboxDemo(this.bodyElement);
    }

    private constructComponent(container: HTMLElement): void {
        const bodyTemplate: string = require('./body.tpl.html');
        const bodyElement: HTMLElement = Utils.createElementFromTemplate(bodyTemplate);
        this.bodyElement = bodyElement;
        container.append(bodyElement);
    }
}