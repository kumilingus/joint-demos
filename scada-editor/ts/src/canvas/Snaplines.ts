import { type dia, g, ui } from '@joint/plus';

/**
 * The snaplines of the canvas, with a fix of the library: a drag of an element embedded in another one
 * (a member of a group, see `Group`) moves its top-most ancestor (the delegated view), and the library
 * snaps that one - but it takes the offset of the pointer from the clicked member, which has none (the
 * offset is stored on the delegated view): the dragged group jumped (its corner to the pointer).
 */
export default class Snaplines extends ui.Snaplines {

    protected initializeSnapWhileMoving(elementView: dia.CellView, evt: dia.Event): void {
        const view = (elementView as dia.ElementView).getDelegatedView();
        if (!view) return;
        const { additionalSnapPoints } = this.options;
        const points = additionalSnapPoints ? additionalSnapPoints.call(this, view, { type: 'move' }) : undefined;
        // The offset of the delegated view (the one moved), not of the clicked one
        const cursorOffset = new g.Point(view.eventData(evt).pointerOffset).scale(-1, -1);
        this.eventData(evt, { cursorOffset, points, initialized: true });
    }
}
