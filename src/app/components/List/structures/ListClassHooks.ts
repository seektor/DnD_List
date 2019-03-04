export interface TListClassHooks {
    listWrapper: string;
    listWrapperTranslateSmooth: string;
    itemTranslateInstant: string;
    itemPlaceholder: string;
}

export default {
    listWrapper: "list__list-wrapper",
    listWrapperTranslateSmooth: "list__list-wrapper--translate-smooth",
    itemTranslateInstant: "list__item--translate-instant",
    itemPlaceholder: "list__item-placeholder",
} as TListClassHooks;