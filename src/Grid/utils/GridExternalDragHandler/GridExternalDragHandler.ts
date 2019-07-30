export class GridExternalDragHandler {

    constructor() {

    }

    // private toggleDropzone(isEnabled: boolean): void {
    //     if (isEnabled) {
    //         this.gridElement.classList.add(GridClassHooks.highlighted);
    //     } else {
    //         this.gridElement.classList.remove(GridClassHooks.highlighted);
    //     }
    // }

    // private onExternalDragStart(externalDraggedElement: HTMLElement, itemContentElement: HTMLElement): void {
    //     this.externalDragState = {
    //         visibleGridElementClientRect: this.gridCalculator.calculateVisibleGridElementClientRect(),
    //         itemContent: itemContentElement
    //     };
    //     this.pointerEventHandler.addEventListener(document, PointerEventType.ActionEnd, this.onExternalDragEnd);
    // }

    // private onExternalDragEnd(event: SyntheticEvent): void {
    //     this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionEnd, this.onExternalDragEnd);
    //     this.toggleExternalAccessListener(false);
    //     if (this.isInClientRectRange(event.clientX, event.clientY, this.externalDragState.visibleGridElementClientRect)) {
    //         this.addItemWithClass(this.externalDragState.itemContent);
    //     }
    //     this.externalDragState = null;
    // }

    // private toggleExternalAccessListener(isEnabled: boolean): void {
    //     if (isEnabled) {
    //         this.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, this.onExternalDragMove);
    //     } else {
    //         this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionMove, this.onExternalDragMove);
    //     }
    // }

    // private onExternalDragMove(event: SyntheticEvent): void {
    //     // console.log(this.isInClientRectRange(event.clientX, event.clientY, this.externalDragState.visibleGridElementClientRect));
    // }

    // private isInClientRectRange(clientX: number, clientY: number, clientRect: TClientRect): boolean {
    //     return clientRect.left <= clientX && clientRect.right >= clientX && clientRect.top <= clientY && clientRect.bottom >= clientY;
    // }

    // public getGridHandlers(): IGridHandlers {
    //     return {
    //         toggleDropzone: (isEnabled) => this.toggleDropzone(isEnabled),
    //         onExternalDragStart: (externalDraggedElement, itemContentElement) => this.onExternalDragStart(externalDraggedElement, itemContentElement)
    //     }
    // }
}