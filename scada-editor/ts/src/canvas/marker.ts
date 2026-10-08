import { dia, V } from '@joint/plus';
import { getFootprint } from '../shapes/common/footprint';
import { labelReach } from '../shapes/attributes/label';
import { controlReach } from '../runtime/controls';
import { ping } from './ping';
import { getScreen } from './screen';

/*
 * The cell marked in the runtime mode (one at most: the cell of the message clicked in the log, the one picked in Find):
 * an arrow pointing at it, flashed when it is marked - above it, clear of its drawing, its label and its control there;
 * below it (pointing up) if it would leave the screen above. A highlighter in the front layer: nothing of the cell
 * changes, its drawing stays as it is.
 */

const MARKER_ID = 'marker';

// The arrow: its width (of its head), the width of its shaft, its height (the tip at the bottom), the height of its
// head, how far above the drawing of the element its tip is
const ARROW_WIDTH = 40;
const SHAFT_WIDTH = 16;
const ARROW_HEIGHT = 52;
const HEAD_HEIGHT = 24;
const ARROW_GAP = 4;

// Its color: of none of the states (the selection and the updates blue, the commands amber, the alarms red), flashed in it
const MARKER_COLOR = 'var(--color-violet)';

/** The outline of the arrow pointing down: its tip at (0, 0) */
const ARROW_PATH = (() => {
    const [head, shaft] = [ARROW_WIDTH / 2, SHAFT_WIDTH / 2];
    return `M 0 0 L ${-head} ${-HEAD_HEIGHT} H ${-shaft} V ${-ARROW_HEIGHT} H ${shaft} V ${-HEAD_HEIGHT} H ${head} Z`;
})();

/**
 * The arrow, upright: at the tip of an element (see `tipOf()`) - in its coordinates, moved with it - or at the middle of
 * the route of a link (in the coordinates of the paper)
 */
const Marker = dia.HighlighterView.extend({
    tagName: 'g',
    attributes: {
        class: 'scada-marker',
        'pointer-events': 'none'
    },
    highlight(this: dia.HighlighterView, cellView: dia.CellView) {
        const { x, y, up } = tipOf(cellView);
        this.vel.empty().append(
            // Pointing up: mirrored
            V('g', { transform: `translate(${x},${y})${up ? ' scale(1,-1)' : ''}` }).append(
                V('path', {
                    class: 'scada-marker-arrow',
                    d: ARROW_PATH,
                    fill: MARKER_COLOR,
                    stroke: 'var(--shape-canvas)',
                    'stroke-width': 2,
                    'stroke-linejoin': 'round'
                })
            )
        );
    },
    transform(this: dia.HighlighterView) {
        const { transformGroup, cellView } = this;
        const { model } = cellView;
        // A link: in the coordinates of the paper already (see `tipOf()`)
        if (!transformGroup || !model.isElement()) return;
        const { x, y } = model.position();
        transformGroup.attr('transform', `translate(${x},${y})`);
    }
});

/**
 * Where the tip of the arrow is (in the coordinates of an element, of the paper for a link) and whether it points up:
 * the middle of a link; above the middle of an element - clear of its drawing, its label and its control on top - or
 * below it (clear of them below) if the arrow would leave the screen above (of the model: the area the run mode shows)
 */
function tipOf(cellView: dia.CellView): dia.Point & { up: boolean } {
    if (cellView instanceof dia.LinkView) return { ...cellView.getPointAtRatio(0.5), up: false };
    if (!(cellView instanceof dia.ElementView)) return { x: 0, y: 0, up: false };
    const { model } = cellView;
    const origin = model.position();
    const drawing = getFootprint(model, { label: false });
    // Above: the tip over the top of the drawing, its label and control there (in the coordinates of the element)
    const above = drawing.topMiddle().offset(0, -Math.max(labelReach(model, 'top'), controlReach(model, 'top')) - ARROW_GAP);
    const screen = model.graph ? getScreen(model.graph) : undefined;
    if (!screen || above.y - ARROW_HEIGHT >= screen.getBBox().y) return { ...above.difference(origin).toJSON(), up: false };
    const below = drawing.bottomMiddle().offset(0, Math.max(labelReach(model, 'bottom'), controlReach(model, 'bottom')) + ARROW_GAP);
    return { ...below.difference(origin).toJSON(), up: true };
}

/** The cell marked (an element flashed too: a ping in the color of the marker), or none (`null`): the one before unmarked */
export function setMarker(paper: dia.Paper, cell: dia.Cell | null): void {
    dia.HighlighterView.removeAll(paper, MARKER_ID);
    const view = cell?.findView(paper);
    if (!cell || !view) return;
    Marker.add(view, 'root', MARKER_ID, { layer: dia.Paper.Layers.FRONT, z: 2 });
    if (cell.isElement()) ping(paper, cell, MARKER_COLOR, `${MARKER_ID}-flash`);
}
