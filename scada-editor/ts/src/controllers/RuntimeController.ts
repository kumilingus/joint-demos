import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { isControlEvent } from '../runtime/controls';
import { zoomToFit } from '../actions';
import { isScreenShown } from '../canvas/screen';

/**
 * The runtime mode: the diagram can't be changed, but the equipment
 * can be operated with its controls. Dragging anywhere pans the canvas
 * (unless it shows the screen: it fills the canvas, also when the window is resized).
 */
export default class RuntimeController extends Controller {

    onWindowResize = () => {
        if (isScreenShown(this.context)) zoomToFit(this.context);
    };

    startListening(): void {
        const { paper } = this.context;

        // The controls are shown in every mode (see `ControlsController`),
        // operated in this one.
        this.listenTo(paper, {
            'cell:pointerdown': onCellPointerdown
        });
        window.addEventListener('resize', this.onWindowResize);
    }

    stopListening(): void {
        super.stopListening();
        window.removeEventListener('resize', this.onWindowResize);
    }
}

function onCellPointerdown(app: App, _cellView: dia.CellView, evt: dia.Event) {
    // Dragging the slider (or anything else on a control) must not pan the canvas.
    if (isControlEvent(evt) || isScreenShown(app)) return;
    app.scroller.startPanning(evt);
}
