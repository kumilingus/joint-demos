import type { dia } from '@joint/plus';
import type { LiquidState, Panel } from './shapes/Panel';

/*
 * The animations of the runtime mode (the Web Animations API on the views of the cells):
 * the rotors spin while the power is on, the liquid flows through the pipes and the open valves,
 * the flames flicker, the smoke rises, the liquid in a level gauge rises and falls to its new level.
 * Nothing is animated while the diagram is edited.
 *
 * An animation doesn't change the model: when it is cancelled, the view is as it was.
 */

type Animator = (cellView: dia.CellView) => Animation[];

const LOOP: KeyframeAnimationOptions = { iterations: Infinity };

/** A node of the view by its selector. */
function node(cellView: dia.CellView, selector: string): SVGElement | null {
    return cellView.findNode(selector) as SVGElement | null;
}

/**
 * Spin the node around a point of the coordinate system it's drawn in
 * (so that the center comes from the model, not from the rendered shape).
 */
function spin(target: SVGElement | null, [x, y]: [number, number], duration: number): Animation[] {
    if (!target) return [];
    const origin = { transformBox: 'view-box', transformOrigin: `${x}px ${y}px` };
    return [target.animate([
        { ...origin, transform: 'rotate(0deg)' },
        { ...origin, transform: 'rotate(360deg)' }
    ], { ...LOOP, duration })];
}

const isOn = (model: dia.Cell) => Boolean(model.get('power'));

/** Whether the liquid passes the element: a switched off pump or a closed valve stops it. */
function isPassing(element: dia.Element | null): boolean {
    if (!element) return true;
    if (element.has('power') && element.get('type') !== 'Beacon') return isOn(element);
    if (element.has('open')) return Boolean(element.get('open'));
    return true;
}

/** The liquid flows through the pipe (from its source to its target) unless one of its ends stops it. */
function isFlowing(link: dia.Link): boolean {
    return isPassing(link.getSourceElement()) && isPassing(link.getTargetElement());
}

// The length of the dash pattern of the flow (see `Pipe`): the offset that moves it by one period
const FLOW_PERIOD = 24;

const flow: Animator = (linkView) => {
    const target = node(linkView, 'flow');
    if (!target || !isFlowing(linkView.model as dia.Link)) return [];
    return [target.animate([
        { strokeOpacity: 0.8, strokeDashoffset: FLOW_PERIOD },
        { strokeOpacity: 0.8, strokeDashoffset: 0 }
    ], { ...LOOP, duration: 800 })];
};

/** The center of the element in its own coordinates */
const center = (cellView: dia.CellView): [number, number] => {
    const { width, height } = (cellView.model as dia.Element).size();
    return [width / 2, height / 2];
};

const animators: Record<string, Animator> = {
    // The rotor and the spokes are drawn around the center already (their groups are moved there).
    Pump: view => isOn(view.model) ? spin(node(view, 'rotor'), [0, 0], 1000) : [],
    Blower: view => isOn(view.model) ? spin(node(view, 'spokes'), [0, 0], 700) : [],
    Fan: view => isOn(view.model) ? spin(node(view, 'blades'), center(view), 600) : [],
    // The blades of each fan are drawn around its hub (their groups are moved there).
    AirCooler: view => isOn(view.model)
        ? [...spin(node(view, 'fan1Blades'), [0, 0], 500), ...spin(node(view, 'fan2Blades'), [0, 0], 550)]
        : [],
    ControlValve: view => {
        const target = node(view, 'liquid');
        if (!target || !view.model.get('open')) return [];
        // 24 is the length of the liquid path (see `ControlValve`)
        return [target.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 24 }], { ...LOOP, duration: 3000 })];
    },
    Boiler: view => ['flameOuter', 'flameInner'].flatMap((selector, index) => {
        const target = node(view, selector);
        if (!target) return [];
        return [target.animate([{ opacity: 1 }, { opacity: 0.65 }, { opacity: 1 }], {
            ...LOOP,
            duration: 500 + index * 170
        })];
    }),
    Chimney: view => {
        const target = node(view, 'smoke');
        if (!target) return [];
        return [target.animate([
            { transform: 'translateY(0)', opacity: 0.9 },
            { transform: 'translateY(-12px)', opacity: 0.3 }
        ], { ...LOOP, duration: 1800, easing: 'ease-out' })];
    },
    CoolingTower: view => {
        const target = node(view, 'plume');
        if (!target) return [];
        const { width } = (view.model as dia.Element).size();
        // The plume grows out of the top of the tower.
        const origin = { transformBox: 'view-box', transformOrigin: `${width / 2}px 10px` };
        return [target.animate([
            { ...origin, transform: 'scale(1)' },
            { ...origin, transform: 'scale(1.06, 1.12)' }
        ], { ...LOOP, duration: 2200, direction: 'alternate', easing: 'ease-in-out' })];
    },
    Beacon: view => {
        const target = node(view, 'glow');
        if (!target || !isOn(view.model)) return [];
        return [target.animate([{ opacity: 0.3 }, { opacity: 1 }], {
            ...LOOP,
            duration: 500,
            direction: 'alternate'
        })];
    }
};

// The time the liquid of a level gauge takes to reach its new level (ms)
const LEVEL_DURATION = 1000;

const liquidKeyframe = ({ y, height, fill }: LiquidState): Keyframe => ({ y: `${y}px`, height: `${height}px`, fill });

export class Animations {

    paper: dia.Paper;
    running = new Map<dia.Cell.ID, Animation[]>();
    levels = new Map<dia.Cell.ID, Animation>();

    constructor(paper: dia.Paper) {
        this.paper = paper;
    }

    start(): void {
        this.paper.model.getCells().forEach(cell => this.animate(cell));
    }

    stop(): void {
        this.running.forEach(animations => animations.forEach(animation => animation.cancel()));
        this.running.clear();
        this.levels.forEach(animation => animation.cancel());
        this.levels.clear();
    }

    /** (Re)start the animations of the cell for its current state (e.g. after its power changed). */
    animate(cell: dia.Cell): void {
        this.running.get(cell.id)?.forEach(animation => animation.cancel());
        this.running.delete(cell.id);
        // Not every type of element is animated.
        const animator = cell.isLink() ? flow : animators[cell.get('type')] as Animator | undefined;
        const cellView = animator && cell.findView(this.paper);
        if (!cellView) return;
        const animations = animator(cellView);
        if (animations.length > 0) this.running.set(cell.id, animations);
    }

    /**
     * The liquid of the level gauge moves from the previous level to the current one
     * (both computed from the model); when it finishes, the view shows the current level.
     */
    animateLevel(panel: Panel): void {
        this.levels.get(panel.id)?.cancel();
        this.levels.delete(panel.id);
        const liquid = panel.findView(this.paper)?.findNode('liquid') as SVGElement | undefined;
        if (!liquid) return;
        const animation = liquid.animate([
            liquidKeyframe(panel.liquidState(panel.previous('level'))),
            liquidKeyframe(panel.liquidState(panel.level))
        ], { duration: LEVEL_DURATION, easing: 'ease-in-out' });
        this.levels.set(panel.id, animation);
        animation.onfinish = () => this.levels.delete(panel.id);
    }

    /** The pipes flow or stop with the equipment at their ends. */
    animatePipes(element: dia.Element): void {
        this.paper.model.getConnectedLinks(element).forEach(link => this.animate(link));
    }
}
