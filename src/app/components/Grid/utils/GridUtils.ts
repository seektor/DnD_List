import { TGridMapData } from "../structures/TGridMapData";
import { TGridDimensions } from "../structures/TGridDimensions";
import { TCoords } from "../../../structures/TCoords";
import { TGridItemPlacement } from "../structures/TGridItemPlacement";
import { TGridParams } from "../structures/TGridParams";
import { TGridItemProperties } from "../structures/TGridItemProperties";
import { TTranslations } from "../../../structures/TTranslations";
import { Direction } from "../../../structures/Direction";

export class GridUtils {



    public static calculateForbiddenTrigger(gridMap: Int16Array[], gridX: number, gridCoords: TCoords, itemsList: HTMLElement[], translations: WeakMap<HTMLElement, TTranslations>) {
        const itemMarker: number = gridMap[gridCoords.y][gridCoords.x];
        if (itemMarker !== -1) {
            const item: HTMLElement = itemsList[itemMarker];
            const itemCenterX: number = item.offsetLeft + item.offsetWidth * 0.5 + translations.get(item).translateX;
            const side: Direction = gridX < itemCenterX ? Direction.Left : Direction.Right;
        }
    }


}