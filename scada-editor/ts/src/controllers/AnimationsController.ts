import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { Animations, getAnimationLevel } from '../runtime/animations';

/**
 * Animates the plant (see `animations.ts`) and keeps the animations in sync with its state:
 * a pump switched off stops spinning and the liquid stops flowing through its pipes,
 * a value shown by a part of a shape (a level, a charge, a column) glides to its new value. What moves is the level of the diagram (see `AnimationLevel`).
 * Active in the runtime mode only.
 */
export default class AnimationsController extends Controller {

    animations: Animations;

    constructor(app: App) {
        super(app);
        this.animations = new Animations(app.paper);
    }

    startListening(): void {
        const { graph } = this.context;

        // The level of the diagram; the alarms only if the user asks the system for less motion
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.animations.level = reducedMotion ? 'alarms' : getAnimationLevel(graph);
        this.animations.start();

        this.listenTo(graph, {
            'change:power change:open': (_app: App, cell: dia.Cell) => onStateChange(this.animations, cell),
            'change:level change:value': (_app: App, element: dia.Element) => this.animations.animateLevel(element)
        });
    }

    stopListening(): void {
        super.stopListening();
        this.animations.stop();
    }
}

/** The cell switched on or off, opened or closed: its animations, and of the pipes of an element */
function onStateChange(animations: Animations, cell: dia.Cell) {
    animations.animate(cell);
    if (cell.isElement()) animations.animatePipes(cell);
}
