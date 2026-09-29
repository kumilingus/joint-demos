import { highlighters, type mvc, type dia, ui, V } from '@joint/plus';
import Pipe from './shapes/Pipe';
import { SELECTION_COLOR, SELECTION_PADDING } from './const';

/*
 * The selection on the canvas (`ui.Selection` over the collection of the app): the region
 * (a drag with Shift on the blank canvas, see `EditController`), the frames of the selected cells
 * and moving several selected elements together. A single selected cell is interacted with as usual
 * (see `SelectionController` for its free transform and link tools).
 */

/**
 * The frame of a selected cell: an element in a rectangle of its size (the model geometry: without
 * the pipe stubs and the label), rotated with it; a link along its route (the stroke highlighter).
 */
class SelectionFrame extends highlighters.stroke {

    protected highlight(cellView: dia.CellView, node: SVGElement): void {
        const { model } = cellView;
        if (!model.isElement()) {
            super.highlight(cellView, node);
            return;
        }
        const { padding = 0, rx, ry, attrs } = this.options;
        const { width, height } = model.size();
        this.vel.attr(attrs ?? {});
        this.vel.attr('d', V.rectToPath({
            x: -padding,
            y: -padding,
            width: width + 2 * padding,
            height: height + 2 * padding,
            rx,
            ry
        }));
    }
}

/** A link is outlined: a wider stroke behind it. */
function frameOptions(cell: dia.Cell): highlighters.StrokeHighlighterArguments {
    if (cell.isLink()) {
        const lineWidth = Number(cell.attr(cell instanceof Pipe ? 'outline/strokeWidth' : 'line/strokeWidth')) || 0;
        return {
            layer: 'back',
            attrs: {
                stroke: SELECTION_COLOR,
                strokeWidth: lineWidth + 6,
                strokeLinejoin: 'round',
                strokeLinecap: 'square'
            }
        };
    }
    return {
        padding: SELECTION_PADDING,
        rx: 2,
        ry: 2,
        attrs: {
            stroke: SELECTION_COLOR,
            strokeWidth: 1.5
        }
    };
}

export function createSelection(scroller: ui.PaperScroller, collection: mvc.Collection<dia.Cell>): ui.Selection {
    return new ui.Selection({
        paper: scroller,
        collection,
        // The links in a region too: tested against their route (not their bounding box)
        selectLinks: true,
        // The screen is selected in the settings only (see `settings.ts`).
        filter: ['Screen'],
        // A single selected cell is dragged as usual, several are moved together by the selection.
        allowCellInteraction: true,
        translateConnectedLinks: ui.Selection.ConnectedLinksTranslation.SUBGRAPH,
        handles: [],
        wrapper: false,
        frames: new ui.HighlighterSelectionFrameList({
            highlighter: SelectionFrame,
            selector: 'root',
            options: frameOptions
        })
    });
}
