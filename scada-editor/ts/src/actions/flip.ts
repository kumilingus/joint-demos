import type { dia } from '@joint/plus';
import type { App } from '../app';
import Shape from '../shapes/models/Shape';
import { flipOf } from '../shapes/attributes/flip';
import Group from '../shapes/models/diagram/Group';

/*
 * The selected shapes flipped (their `flip`, see `flip.ts` of the attributes): each in its place, horizontally or vertically - the
 * members of a selected group too. One step of the history.
 */

export type FlipAxis = 'x' | 'y';

/** The shapes of the selection (the members of its groups too) that can be flipped along the axis */
export function flipTargets(app: App, axis: FlipAxis): Shape[] {
    const elements = app.selection.toArray().flatMap(cell => (Group.isGroup(cell) ? cell.getEmbeddedCells({ deep: true }) : [cell]));
    return [...new Set(elements)].filter((cell): cell is Shape => Shape.isShape(cell) && Boolean(cell.flippable?.includes(axis)));
}

/** The flip of the element with the axis turned on or off (`x`, `y`, `xy` or none) */
function toggled(element: dia.Element, axis: FlipAxis): string {
    const flip = flipOf(element);
    const x = flip.includes('x') !== (axis === 'x');
    const y = flip.includes('y') !== (axis === 'y');
    return `${x ? 'x' : ''}${y ? 'y' : ''}`;
}

/** Flip the selected shapes along the axis (those that can be) */
export function flipSelection(app: App, axis: FlipAxis): void {
    const targets = flipTargets(app, axis);
    if (targets.length === 0) {
        return;
    }
    app.graph.startBatch('flip');
    targets.forEach((shape) => {
        const flip = toggled(shape, axis);
        // Not flipped: none (absent in the JSON)
        if (flip) {
            shape.set('flip', flip);
        } else {
            shape.unset('flip');
        }
    });
    app.graph.stopBatch('flip');
}
