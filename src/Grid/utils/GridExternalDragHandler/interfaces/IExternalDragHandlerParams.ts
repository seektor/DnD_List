import { PointerEventHandler } from '../../../../common/utils/pointer-event-handler/PointerEventHandler';
import { SyntheticEvent } from '../../../../common/utils/pointer-event-handler/structures/SyntheticEvent';
import { TGridItemDimensions } from '../../../structures/TGridItemDimensions';
import { GridCalculator } from '../../GridCalculator/GridCalculator';

export interface IExternalDragHandlerParams {
    gridElement: HTMLElement;
    gridCalculator: GridCalculator;
    pointerEventHandler: PointerEventHandler;
    addItemWithClass(content: HTMLElement, position?: number): void;
    getItemsList(): HTMLElement[];
    getGridItemDimensions(): WeakMap<HTMLElement, TGridItemDimensions>;
    onDragStart(event: SyntheticEvent): void;
    onDragTerminate(): void;
    removeItem(position: number): void;
}