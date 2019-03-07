export interface TListClassHooks {
    listWrapper: string;
    list: string;
    listHighlighted: string;
    listTranslateSmooth: string;
    itemTranslateInstant: string;
    itemPlaceholder: string;
}

export default {
    listWrapper: "list__list-wrapper",
    list: "list__list",
    listHighlighted: "list__list--highlighted",
    listTranslateSmooth: "list__list--translate-smooth",
    itemTranslateInstant: "list__item--translate-instant",
    itemPlaceholder: "list__item-placeholder",
} as TListClassHooks;