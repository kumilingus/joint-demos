import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { ZOOM } from '../config';
import { Mode } from '../const';
import { isScreenShown } from '../screen';

/**
 * Panning and zooming of the canvas. Active in every mode.
 */
export default class CanvasController extends Controller {

    startListening(): void {
        const { paper, scroller } = this.context;

        this.listenTo(paper, {
            'blank:pointerdown': onBlankPointerdown,
            'paper:pinch': onPaperPinch,
            'paper:pan': onPaperPan
        });

        this.listenTo(scroller, {
            'pan:start': onPanStart,
            'pan:stop': onPanStop
        });
    }
}

function onBlankPointerdown(app: App, evt: dia.Event) {
    // In the edit mode, a drag with Shift selects a region (see `EditController`).
    if (app.mode === Mode.Edit && evt.shiftKey) return;
    // The screen stays fitted to the canvas.
    if (isScreenShown(app)) return;
    app.scroller.startPanning(evt);
}

function onPaperPinch(app: App, _evt: dia.Event, ox: number, oy: number, scale: number) {
    const { scroller } = app;
    if (isScreenShown(app)) return;
    scroller.zoom(scroller.zoom() * scale, {
        min: ZOOM.min,
        max: ZOOM.max,
        ox,
        oy,
        absolute: true
    });
}

function onPaperPan(app: App, evt: dia.Event, tx: number, ty: number) {
    const { scroller } = app;
    evt.preventDefault();
    if (isScreenShown(app)) return;
    scroller.el.scrollLeft += tx;
    scroller.el.scrollTop += ty;
}

function onPanStart(app: App) {
    app.scroller.setCursor('grabbing');
}

function onPanStop(app: App) {
    app.scroller.setCursor('grab');
}
