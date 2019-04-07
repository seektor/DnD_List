export interface TListItemAttributeHooks {
    item: string;
    dragAnchor: string;
    clickAnchor: string;
}

export default {
    item: "list-item-factory",
    dragAnchor: "list-item__drag-anchor",
    clickAnchor: "list-item__click-anchor",
} as TListItemAttributeHooks;