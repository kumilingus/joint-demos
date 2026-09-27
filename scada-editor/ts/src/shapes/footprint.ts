import { type dia, g } from '@joint/plus';
import { Shape } from './Shape';

/** How far the drawing of a shape reaches out of its model bounding box (on top of the default). */
export interface Overflow {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

/** Most of the shapes have their label below them. */
const DEFAULT_OVERFLOW: Overflow = { bottom: 30 };

// The half of the stroke of a pipe
const PIPE_HALF_WIDTH = 8;

// The pipe ends are a little taller than the pipe stubs (see `pipePorts()`).
const PORT_END_OVERHANG = 3;

/**
 * The area the cell takes on the paper, computed from the model only:
 * the bounding box, the ports and the overflow of the shape (`Shape.overflow`).
 */
export function getFootprint(cell: dia.Cell): g.Rect {
    const bbox = cell.getBBox();
    if (cell.isLink()) return bbox.inflate(PIPE_HALF_WIDTH);

    const element = cell as dia.Element;
    let footprint = bbox.clone();

    // A port (a pipe stub) may reach its width to either side of its position.
    const groups: Record<string, dia.Element.PortGroup> = element.prop(['ports', 'groups']) || {};
    Object.entries(groups).forEach(([name, group]) => {
        const { width = 0, height = 0 } = group.size || {};
        Object.values(element.getPortsPositions(name)).forEach(({ x, y }) => {
            footprint = footprint.union(new g.Rect(
                bbox.x + x - width,
                bbox.y + y - height / 2 - PORT_END_OVERHANG,
                2 * width,
                height + 2 * PORT_END_OVERHANG
            ));
        });
    });

    const overflow = Shape.isShape(element) ? element.overflow : {};
    const { top = 0, right = 0, bottom = 0, left = 0 } = { ...DEFAULT_OVERFLOW, ...overflow };
    return footprint.moveAndExpand({ x: -left, y: -top, width: left + right, height: top + bottom });
}
