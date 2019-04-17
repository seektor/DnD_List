export interface TListItemAttributeHooks {
    item: string;
    dragAnchor: string;
    clickAnchor: string;
}

export default {
    item: "data-list-item-factory",
    dragAnchor: "data-list-item__drag-anchor",
    clickAnchor: "data-list-item__click-anchor",
} as TListItemAttributeHooks;