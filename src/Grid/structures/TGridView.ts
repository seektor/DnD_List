import { TGridMapData } from "./TGridMapData";
import { TTranslations } from "../../common/structures/TTranslations";
import { TGridDimensions } from "./TGridDimensions";
import { TGridItemTrigger } from "./TGridItemTrigger";

export interface TGridView {
    itemsList: HTMLElement[];
    placeholderIndex: number;
    gridMapData: TGridMapData;
    itemTranslations: WeakMap<HTMLElement, TTranslations>;
    gridDimensions: TGridDimensions;
    forbiddenTrigger: TGridItemTrigger;
}