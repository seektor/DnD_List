import { Utils } from '../../../common/utils/Utils';
import { TGridItemProperties } from '../../structures/TGridItemProperties';

export class GridUtils {

    public static getGridItemPropertiesFromStyles(item: HTMLElement, columnCount: number): TGridItemProperties {
        const computedProperties: CSSStyleDeclaration = window.getComputedStyle(item);
        const rowspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridRowStart);
        const colspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridColumnStart);
        const rowspan: number = rowspanProperty === null ? 1 : parseInt(rowspanProperty[0].split(' ')[1]);
        const colspan: number = colspanProperty === null ? 1 : Math.min(parseInt(colspanProperty[0].split(' ')[1]), columnCount);
        return {
            colspan: colspan,
            rowspan: rowspan,
        }
    }

    public static getReorderedItemList(itemList: HTMLElement[], previousPlaceholderIndex: number, newPlaceholderIndex: number): HTMLElement[] {
        const newItemList: HTMLElement[] = [...itemList];
        Utils.moveItemInArray(newItemList, previousPlaceholderIndex, newPlaceholderIndex);
        return newItemList;
    }

    public static isBetweenColumns(value: number, min: number, max: number): boolean {
        return value >= min && value < max;
    }
}