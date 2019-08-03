import { TDomRect } from '../../../../common/structures/TDomRect';

export interface TExternalDragState {
    gridVisiblePageRect: TDomRect;
    externalDraggedElement: HTMLElement;
    isOver: boolean;
    itemContent: HTMLElement;
    insertIndex: number | null;
    onInsertCallback: (index: number) => void;
}