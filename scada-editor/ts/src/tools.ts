import { linkTools } from '@joint/plus';
import { SELECTION_COLOR } from './const';

/*
 * The link tools of the selected pipe, in the color of the selection (as the frame of a selected element).
 */

/**
 * The arrowheads: translucent pills over the ends of the pipe (along it, a little wider than it).
 * Dragging one reconnects the end, or moves its anchor along the side of the same element
 * (see `connectionStrategy` in `connections.ts`) - there is no anchor tool.
 */
const arrowheadAttributes = {
    x: -12,
    y: -10,
    width: 24,
    height: 20,
    rx: 10,
    ry: 10,
    fill: SELECTION_COLOR,
    fillOpacity: 0.35,
    stroke: 'none',
    cursor: 'move'
};

export const SourceArrowhead = linkTools.SourceArrowhead.extend({
    tagName: 'rect',
    attributes: { ...arrowheadAttributes, class: 'source-arrowhead' }
});

export const TargetArrowhead = linkTools.TargetArrowhead.extend({
    tagName: 'rect',
    attributes: { ...arrowheadAttributes, class: 'target-arrowhead' }
});

/**
 * A vertex of the pipe (the `handleClass` of `linkTools.Vertices`): a handle as those of the frame
 * of a selected element - filled with the background (`styles.css`), outlined with the selection.
 */
export const VertexHandle = linkTools.Vertices.VertexHandle.extend({
    attributes: {
        class: 'vertex-handle',
        r: 5,
        fill: '#ffffff',
        stroke: SELECTION_COLOR,
        strokeWidth: 1.5,
        cursor: 'move'
    }
});
