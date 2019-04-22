import { TGridMapData } from "./TGridMapData";
import { TTranslations } from "../../../structures/TTranslations";
import { TGridDimensions } from "./TGridDimensions";

export interface TGridView {
    itemsList: HTMLElement[];
    placeholderIndex: number;
    gridMapData: TGridMapData;
    itemTranslations: WeakMap<HTMLElement, TTranslations>;
    gridDimensions: TGridDimensions;
}