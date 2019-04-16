export interface TGridAttributeHooks {
    rowspan: string,
    colspan: string,
    itemDragAnchor: string,
    item: string
}

export default {
    rowspan: 'data-rowspan',
    colspan: 'data-colspan',
    itemDragAnchor: 'grid__item-drag-anchor',
    item: 'grid__item'
} as TGridAttributeHooks;