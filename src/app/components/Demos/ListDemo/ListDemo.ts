import { Utils } from "../../../utils/Utils";
import { ContainerFactory } from "../../Viewport/Factories/ContainerFactory/ContainerFactory";
import { List } from "../../List/List";
import { ItemFactory, ItemWithTextFactory, itemWithInputFactory as ItemWithInputFactory } from "../../Viewport/Factories/ItemFactory/ItemFactory";

export class ListDemo {

    constructor(container: HTMLElement) {
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const listTemplate: string = require("./list-demo.tpl.html");
        const listElement: HTMLElement = Utils.createElementFromTemplate(listTemplate);
        const containerElement: HTMLElement = ContainerFactory();
        listElement.append(containerElement);
        container.append(listElement);
        this.createList(containerElement);
    }

    private createList(containerElement: HTMLElement): void {
        const list: List = new List(containerElement, { itemMarginBottom: 20 });
        const lyrics: string = "Push me And then just touch me Till I can get my satisfaction Satisfaction Satisfaction Satisfaction Satisfaction Push me And then just touch me Till I can get my satisfaction Satisfaction";
        const lyricsArray: string[] = lyrics.split(" ");
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let i = 0; i < lyricsArray.length; i++) {
            const text: string = lyricsArray[i];
            let item: HTMLElement;
            const currentGradientColors: string[] = gradientColors[i % gradientColors.length];
            const background: string = Utils.createLinearGradient(currentGradientColors[0], currentGradientColors[1], 90)
            if (i % 5 !== 0) {
                item = ItemWithTextFactory(background, text);
            } else {
                item = ItemWithInputFactory(background, text, currentGradientColors[0]);
            }
            list.addItem(item);
        }
    }
}