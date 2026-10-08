import type { dia } from '@joint/plus';

/*
 * The move of an element handed over to another view in the middle of a press (the copy of a duplicating drag, see
 * `EditController`): as an embedded element hands its move over to its parent - by the data of the event of the
 * pressed view (`action`, `delegatedView`, as `ElementView.dragStart()` sets them; not a public API of JointJS yet).
 * The pressed view keeps the press: it forwards the moves and the release to the delegate, the snaplines snap it.
 *
 * TODO: the keys of the event data are internals of `ElementView` - a public `delegateDrag()`, `getDragDelegate()`
 * would replace this file: clientIO/joint#3534
 */

/** The view moved by the press of the view: itself, its parent (an embedded one), a delegate - `null` if none moves */
export function getDragDelegate(view: dia.ElementView, evt: dia.Event): dia.ElementView | null {
    const { action, delegatedView } = view.eventData(evt);
    return action === 'move' ? (delegatedView ?? view) : null;
}

/**
 * The press of the view moves the delegate from now on (grabbed where the view was pressed: at the point of the press),
 * moved to the pointer at once
 */
export function delegateDrag(
    view: dia.ElementView,
    evt: dia.Event,
    delegate: dia.ElementView,
    pressed: dia.Point,
    x: number,
    y: number
): void {
    const { paper } = view;
    if (!paper) return;
    paper.setDragging(evt);
    view.eventData(evt, { defaultInteractionPrevented: false, action: 'move', delegatedView: delegate });
    const position = delegate.model.position();
    delegate.eventData(evt, {
        initialPosition: position,
        pointerOffset: position.difference(pressed.x, pressed.y),
        restrictedArea: paper.getRestrictedArea(delegate, x, y)
    });
    // `drag()` is protected in the typings (a library internal, see the TODO above)
    (delegate as dia.ElementView & { drag(evt: dia.Event, x: number, y: number): void }).drag(evt, x, y);
}
