export class Utils {

    public static createElementFromTemplate(template: string): HTMLElement {
        return document.createRange().createContextualFragment(template).firstElementChild as HTMLElement;
    }

    public static getElementByAttribute(element: HTMLElement, attribute: string): HTMLElement {
        return element.querySelector(`[${attribute}]`);
    }

    public static getRandomColor(): string {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}