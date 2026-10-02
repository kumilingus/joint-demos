import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { Animations, getAnimationLevel } from '../animations';
import Panel from '../shapes/Panel';

/**
 * Animates the plant (see `animations.ts`) and keeps the animations in sync with its state:
 * a pump switched off stops spinning and the liquid stops flowing through its pipes,
 * the liquid of a level gauge moves to its new level. What moves is the level of the diagram (see `AnimationLevel`).
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
            'change:power change:open': (_app: App, element: dia.Element) => onStateChange(this.animations, element),
            'change:level': (_app: App, element: dia.Element) => onLevelChange(this.animations, element)
        });
    }

    stopListening(): void {
        super.stopListening();
        this.animations.stop();
    }
}

function onStateChange(animations: Animations, element: dia.Element) {
    animations.animate(element);
    animations.animatePipes(element);
}

function onLevelChange(animations: Animations, element: dia.Element) {
    if (element instanceof Panel) animations.animateLevel(element);
}
