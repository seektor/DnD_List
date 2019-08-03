import { IUnsubscribeCallback } from '../../common/interfaces/IUnsubscribeCallback';
import { TTranslations } from '../../common/structures/TTranslations';
import { IAutoScrollCallbacks } from '../../common/utils/auto-scroll/interfaces/IAutoScrollCallbacks';
import { TDragViewportParams } from '../../List/structures/TDragViewportParams';
import { TGridView } from './TGridView';

export interface TGridDragState {
    originalDragItemsList: HTMLElement[];
    originalDraggedElementIndex: number;
    dragViewportParams: TDragViewportParams;
    gridView: TGridView;
    draggedElement: HTMLElement;
    draggedElementTranslations: TTranslations;
    containerScrollCallbacks: IAutoScrollCallbacks;
    itemsTranslationUnsubscribeCallback: IUnsubscribeCallback | null;
    isTranslating: boolean;
}