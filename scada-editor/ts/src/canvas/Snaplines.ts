import { type dia, g, ui } from '@joint/plus';
import { getDragDelegate } from './drag';

/**
 * The snaplines of the canvas, with a fix of the library: a press of an element can move another view (the delegate:
 * the top-most ancestor of a member of a group, see `Group`; the copy of a duplicating drag, see `drag.ts`), and the library
 * snaps that one - but it takes the offset of the pointer from the pressed element, which has none (the offset is
 * stored on the delegate): the moved view jumped (its corner to the pointer).
 */
export default class Snaplines extends ui.Snaplines {

    protected initializeSnapWhileMoving(elementView: dia.CellView, evt: dia.Event): void {
        // The view the press moves: of the gesture (a delegate) or the one it would move (an embedded one's ancestor)
        const pressed = elementView as dia.ElementView;
        const view = getDragDelegate(pressed, evt) ?? pressed.getDelegatedView();
        if (!view) {
            return;
        }
        const { additionalSnapPoints } = this.options;
        const points = additionalSnapPoints ? additionalSnapPoints.call(this, view, { type: 'move' }) : undefined;
        // The offset of the delegate (the one moved), not of the pressed one
        const cursorOffset = new g.Point(view.eventData(evt).pointerOffset).scale(-1, -1);
        this.eventData(evt, { cursorOffset, points, initialized: true });
    }
}
