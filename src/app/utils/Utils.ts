export class Utils {

    public static createElementFromTemplate(template: string): HTMLElement {
        return document.createRange().createContextualFragment(template).firstElementChild as HTMLElement;
    }
}