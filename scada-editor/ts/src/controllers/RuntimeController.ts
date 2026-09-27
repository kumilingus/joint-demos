import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { isControlEvent } from '../controls';

/**
 * The runtime mode: the diagram can't be changed, but the equipment
 * can be operated with its controls. Dragging anywhere pans the canvas.
 */
export default class RuntimeController extends Controller {

    startListening(): void {
        const { paper } = this.context;

        // The controls are shown in every mode (see `ControlsController`),
        // operated in this one.
        this.listenTo(paper, {
            'cell:pointerdown': onCellPointerdown
        });
    }
}

function onCellPointerdown(app: App, _cellView: dia.CellView, evt: dia.Event) {
    // Dragging the slider (or anything else on a control) must not pan the canvas.
    if (isControlEvent(evt)) return;
    app.scroller.startPanning(evt);
}
