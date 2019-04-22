export interface TGridAttributeHooks {
    itemDragAnchor: string,
    item: string
}

export default {
    itemDragAnchor: 'data-grid__item-drag-anchor',
    item: 'data-grid__item'
} as TGridAttributeHooks;