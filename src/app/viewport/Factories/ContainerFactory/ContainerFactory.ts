import { Utils } from '../../../../common/utils/Utils';

export function ContainerFactory(): HTMLElement {
    const containerTemplate: string = require('./container-factory.tpl.html');
    const containerElement: HTMLElement = Utils.createElementFromTemplate(containerTemplate);
    return containerElement;
}