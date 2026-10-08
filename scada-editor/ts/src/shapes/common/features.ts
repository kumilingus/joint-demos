import type { dia } from '@joint/plus';
import Shape, { type CellFeatures } from './Shape';
import Connection from './Connection';

/** What the editor needs to know about the cell (see `CellFeatures`): of a shape, a link of its own - none of another (the screen) */
export function featuresOf(cell: dia.Cell): CellFeatures | null {
    return Shape.isShape(cell) || Connection.isConnection(cell) ? cell : null;
}
