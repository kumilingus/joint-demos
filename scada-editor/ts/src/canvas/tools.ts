import { linkTools } from '@joint/plus';
import { SELECTION_COLOR } from '../const';

/*
 * The link tools of the selected pipe, in the color of the selection (as the frame of a selected element).
 */

/**
 * The arrowheads: dots at the ends of the pipe in the color of the selection, ringed with the background
 * (see `theme/theme-minimal.css`): they stand out on a pipe of any color. Dragging one reconnects the end, or moves
 * its anchor along the side of the same element (see `connectionStrategy` in `connections.ts`)
 * - there is no anchor tool.
 */
const arrowheadAttributes = {
    r: 10,
    fill: SELECTION_COLOR,
    stroke: '#ffffff',
    strokeWidth: 2.5,
    cursor: 'move'
};

export const SourceArrowhead = linkTools.SourceArrowhead.extend({
    tagName: 'circle',
    attributes: { ...arrowheadAttributes, class: 'source-arrowhead' }
});

export const TargetArrowhead = linkTools.TargetArrowhead.extend({
    tagName: 'circle',
    attributes: { ...arrowheadAttributes, class: 'target-arrowhead' }
});

/**
 * A vertex of the pipe (the `handleClass` of `linkTools.Vertices`): as the arrowheads, smaller
 * (the colors in `theme/theme-minimal.css`) - a bend, not an end.
 */
export const VertexHandle = linkTools.Vertices.VertexHandle.extend({
    attributes: {
        class: 'vertex-handle',
        r: 7,
        fill: SELECTION_COLOR,
        stroke: '#ffffff',
        strokeWidth: 2.5,
        cursor: 'move'
    }
});
