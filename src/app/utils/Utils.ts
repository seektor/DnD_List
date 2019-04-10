export class Utils {

    public static gradientColors: Map<string, string[]> = new Map([
        ['blue', ['#3949AB', '#4FC3F7']],
        ['orange', ['#FF8F00', '#FFECB3']],
        ['red', ['#9C27B0', '#FF3D00']],
        ['green', ['#2E7D32', '#4DB6AC']],
        ['pink', ['#EA80FC', '#FCE4EC']],
        ['violet', ['#4527A0', '#7B1FA2']],
        ['gray', ['#CFD8DC', '#546E7A']],
        ['lightBlue', ['#C5CAE9', '#B3E5FC']],
        ['pinkOrange', ['#D500F9', '#FFA000']],
        ['aquamarine', ['#00E5FF', '#CCFF90']]
    ]);

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

    public static createLinearGradient(colorA: string, colorB: string, angleInDeg: number): string {
        return `linear-gradient(${angleInDeg}deg, ${colorA}, ${colorB})`;
    }
}