export interface TGridAttributeHooks {
    rowspan: string,
    colspan: string,
    itemDragAnchor: string,
    item: string
}

export default {
    rowspan: 'data-rowspan',
    colspan: 'data-colspan',
    itemDragAnchor: 'data-grid__item-drag-anchor',
    item: 'data-grid__item'
} as TGridAttributeHooks;