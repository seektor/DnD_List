# DnD Playground

## Grid
Grid with the abillity to reorder its items by dragging and dropping each of the elements in a different spot. The grid is built using the css grid. Therefore the 'packing algorithm' mirrors its implementation.

Built only using mouseDown, mouseMove and mouseUp events.

While dragging the element to the edges of the grid container the view is being autoscrolled with the proper speed.

Items are being added to the grid by providing the html content with the `gridRowStart` and `gridColumnStart` attached to it by class values. A proper class observer will be attached as well in case the class chhanges dynamically.

Normally the columns take 1fr as its width. However the min width can be provided via the constructor.

Toolbox allows adding new items dynamically by dragging the proper item to the grid area where it changees its representation according to the template provided.