import Controller from './Controller';

// How long the pointer rests before the cursor is hidden (ms)
const HIDE_DELAY = 3000;

/** The class of the paper scroller while the cursor is hidden (see `runtime.css`) */
const HIDDEN_CLASS = 'scada-cursor-hidden';

/**
 * The runtime mode: the mouse cursor hidden while the pointer rests on the canvas (a display watched, not operated),
 * shown again when it moves. Not while a button is pressed (a slider dragged).
 */
export default class CursorController extends Controller {

    protected timer = 0;

    onPointerMove = (evt: PointerEvent) => this.restart(evt);
    onPointerLeave = () => this.show();

    startListening(): void {
        const { el } = this.app.scroller;
        el.addEventListener('pointermove', this.onPointerMove);
        el.addEventListener('pointerdown', this.onPointerMove);
        el.addEventListener('pointerleave', this.onPointerLeave);
    }

    stopListening(): void {
        super.stopListening();
        const { el } = this.app.scroller;
        el.removeEventListener('pointermove', this.onPointerMove);
        el.removeEventListener('pointerdown', this.onPointerMove);
        el.removeEventListener('pointerleave', this.onPointerLeave);
        this.show();
    }

    /** The cursor shown, hidden again after a rest (a mouse only: a touch or a pen has no cursor) */
    protected restart(evt: PointerEvent): void {
        this.show();
        if (evt.pointerType === 'mouse' && evt.buttons === 0) {
            this.timer = window.setTimeout(() => this.hide(), HIDE_DELAY);
        }
    }

    protected show(): void {
        window.clearTimeout(this.timer);
        this.app.scroller.el.classList.remove(HIDDEN_CLASS);
    }

    protected hide(): void {
        this.app.scroller.el.classList.add(HIDDEN_CLASS);
    }
}
