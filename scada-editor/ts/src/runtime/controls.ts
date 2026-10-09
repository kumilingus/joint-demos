import { dia, util, type mvc } from '@joint/plus';
import Shape from '../shapes/models/Shape';
import { besideElement, seenBBox, sideOf } from '../shapes/attributes/label';
import { readProperty, type TagValue } from '../plant/properties';
import { flipOf } from '../shapes/attributes/flip';
import { dataOf } from '../shapes/common/data';
import { getTag } from '../shapes/common/tag';

/*
 * The controls of the equipment: highlighters embedding HTML form controls
 * in a `foreignObject`. They are shown in both modes, but can be operated
 * in the runtime mode only: while editing they are inert (not focused, not clicked - the pointer goes through to
 * the element, to select it or to move it) and dimmed (`.scada-control-inert` in `runtime.css`).
 * In the runtime mode the paper ignores the events on them (its `guard`, see `app.ts`).
 */

/**
 * A command of the operator: the value of the property of the element asked for (see `properties.ts`) - the `command`
 * event of the element, sent to the plant (see `ControlsController`). Nothing of the element changes: the plant
 * answers with an update when it is done (the valve moved, the pump started), as a SCADA server would.
 */
function command(element: dia.Element, property: string, value: TagValue): void {
    element.trigger('command', element, property, value);
}

// The sizes of the controls beside the element (their `foreignObject`s below), the space between them and the element
const TOGGLE_SIZE = { width: 100, height: 30 };
const SLIDER_SIZE = { width: 100, height: 42 };
const CONTROL_GAP = 6;

/**
 * The room around a control in its `foreignObject` for the focus ring (outside of the control, see `runtime.css`): the
 * `foreignObject` that much bigger on each side, the control placed as without it
 */
const FOCUS_MARGIN = 4;

/** The attributes of the `foreignObject` of a control of the size: with the room for its focus ring */
const foreignObjectAttributes = ({ width, height }: { width: number; height: number }) =>
    `x="${-FOCUS_MARGIN}" y="${-FOCUS_MARGIN}" width="${width + 2 * FOCUS_MARGIN}" height="${height + 2 * FOCUS_MARGIN}"`;

/** The class of the root of every control. */
const CONTROL_CLASS = 'scada-control';

/** Whether the event started on a control (and not on the element under it). */
export function isControlEvent(evt: dia.Event): boolean {
    return evt.target instanceof Element && evt.target.closest(`.${CONTROL_CLASS}`) !== null;
}

/** The markup of the controls (parsed once, shared by all of them) */
// The size of the checkbox in the corner of a pump
const CHECKBOX_SIZE = 20;

const pumpControlMarkup = util.svg/* xml */`
    <foreignObject class="${CONTROL_CLASS}" ${foreignObjectAttributes({ width: CHECKBOX_SIZE, height: CHECKBOX_SIZE })}>
        <div class="scada-control-checkbox" xmlns="http://www.w3.org/1999/xhtml">
            <input @selector="input" class="scada-control-checkbox-input" type="checkbox"/>
        </div>
    </foreignObject>
`;

const toggleValveControlMarkup = util.svg/* xml */`
    <foreignObject class="${CONTROL_CLASS}" ${foreignObjectAttributes(TOGGLE_SIZE)}>
        <div @selector="switch" class="scada-control-switch" role="group" xmlns="http://www.w3.org/1999/xhtml">
            <button @selector="buttonOn" class="scada-control-switch-on" data-open="true">Open</button>
            <button @selector="buttonOff" class="scada-control-switch-off" data-open="false">Closed</button>
        </div>
    </foreignObject>
`;

const sliderValveControlMarkup = util.svg/* xml */`
    <foreignObject class="${CONTROL_CLASS}" ${foreignObjectAttributes(SLIDER_SIZE)}>
        <div class="scada-control-slider" xmlns="http://www.w3.org/1999/xhtml">
            <input @selector="slider" class="scada-control-slider-input" type="range" min="0" max="100" step="25"/>
            <output @selector="value" class="scada-control-slider-output"></output>
        </div>
    </foreignObject>
`;

// How long a command waits for the plant (ms): pending until the plant updates the property, or this long
const PENDING_TIMEOUT = 5000;

/** Whether the controls of the paper can be operated (in the runtime mode, see `setControlsOperable()`). */
const operable = new WeakMap<dia.Paper, boolean>();

abstract class Control extends dia.HighlighterView {

    /** The command sent and not done yet (the plant hasn't updated the property to the value): shown as pending */
    protected pending: { property: string; value: TagValue; timer: number } | null = null;

    /** A command of the operator (see `command()`): pending until the plant does it */
    protected request(property: string, value: TagValue): void {
        const { model } = this.cellView;
        if (!model.isElement()) {
            return;
        }
        if (this.pending) {
            window.clearTimeout(this.pending.timer);
        }
        // Not done in a while (no plant, refused): not pending any more, the state as it is
        const timer = window.setTimeout(() => {
            this.pending = null;
            if (this.el.isConnected) {
                this.update();
            }
        }, PENDING_TIMEOUT);
        this.pending = { property, value, timer };
        command(model, property, value);
        this.update();
    }

    /** Pending until the element has the value asked for (`.scada-control-pending` in `runtime.css`: a busy cursor, a pulse) */
    protected updatePending(element: dia.Element): void {
        const { pending } = this;
        if (pending && readProperty(element, pending.property) === pending.value) {
            window.clearTimeout(pending.timer);
            this.pending = null;
        }
        this.el.classList.toggle('scada-control-pending', this.pending !== null);
    }

    /**
     * Inert unless the controls of its paper can be operated (the HTML content: `inert` is an HTML attribute); the
     * pointer through it then (to the element under it), the control dimmed
     */
    protected updateInert(cellView: dia.CellView): void {
        const { paper } = cellView;
        const inert = !paper || !operable.get(paper);
        this.el.classList.toggle('scada-control-inert', inert);
        this.el.querySelectorAll('foreignObject > *').forEach(node => node.toggleAttribute('inert', inert));
    }

    /** The name of the element for screen readers (the control has no visible label): its tag, else its label */
    protected getElementName(element: dia.Element): string {
        return getTag(element) ?? element.prop(['label', 'text']) ?? '';
    }

    /** The node of `children` by its `@selector`, if it is of the type */
    protected getNode<T extends Element>(selector: string, type: abstract new () => T): T | null {
        const node = this.childNodes?.[selector];
        return node instanceof type ? node : null;
    }

    /**
     * Upright: in a layer of the paper (see `updateControl()`), moved with the element but not rotated with it
     * (the built-in transform of a highlighter in a layer is the translation and the rotation of the element).
     */
    protected transform(): void {
        const { transformGroup, cellView } = this;
        if (!transformGroup) {
            return;
        }
        const { x, y } = cellView.model.position();
        transformGroup.attr('transform', `translate(${x},${y})`);
    }

    /** Place the control at the point (in the coordinates of the element as it is seen, see `transform()`) */
    protected place(x: number, y: number): void {
        this.el.setAttribute('transform', `translate(${x},${y})`);
    }

    /** Place the control in the top left corner of the element as it is seen (rotated) - flipped: the top right one */
    protected placeInCorner(element: dia.Element): void {
        const { x, y, width } = seenBBox(element);
        const flipped = flipOf(element).includes('x');
        this.place(flipped ? x + width - 5 - CHECKBOX_SIZE : x + 5, y + 5);
    }

    /**
     * Place the control (of the size) beside the element, on its side (`controlPosition`, set in the inspector, below
     * unless set): on that side as it is seen, clear of the drawing (see `besideElement()`)
     */
    protected placeBeside(element: dia.Element, width: number, height: number): void {
        const side = sideOf(element.get('controlPosition'));
        const { x, y } = besideElement(element, side, { width, height }, CONTROL_GAP);
        const corner = {
            bottom: { x: x - width / 2, y },
            top: { x: x - width / 2, y: y - height },
            left: { x: x - width, y: y - height / 2 },
            right: { x, y: y - height / 2 }
        }[side];
        this.place(corner.x, corner.y);
    }
}

/** A checkbox that turns a pump (a motor, a beacon, ...) on and off. */
class PumpControl extends Control {

    preinitialize(): void {
        // `angle`, `size`, `flip`: in the corner as it is seen (flipped: the other one, see `flip.ts`)
        this.UPDATE_ATTRIBUTES = ['data', 'angle', 'size', 'flip'];
        this.tagName = 'g';
        this.children = pumpControlMarkup;
    }

    events(): mvc.EventsHash {
        return { 'change input': 'onChange' };
    }

    protected highlight(cellView: dia.CellView): void {
        const { model } = cellView;
        if (!model.isElement()) {
            return;
        }
        this.renderChildren();
        this.placeInCorner(model);
        const input = this.getNode('input', HTMLInputElement);
        if (input) {
            input.checked = Boolean(dataOf(model, 'power'));
            input.setAttribute('aria-label', `${this.getElementName(model)} running`);
        }
        this.updatePending(model);
        this.updateInert(cellView);
    }

    /** Asked to run or to stop: the checkbox shows the state of the pump until the plant changes it (pending) */
    onChange(evt: dia.Event): void {
        const { target } = evt;
        if (target instanceof HTMLInputElement) {
            this.request('power', target.checked);
        }
    }
}

/** Open / close buttons of a hand valve (a ball valve, ...). */
class ToggleValveControl extends Control {

    preinitialize(): void {
        // `controlPosition`, `angle`, `size`, `flip`: beside the valve, clear of its drawing (see `placeBeside()`)
        this.UPDATE_ATTRIBUTES = ['data', 'controlPosition', 'angle', 'size', 'flip'];
        this.children = toggleValveControlMarkup;
    }

    events(): mvc.EventsHash {
        return { 'click button': 'onButtonClick' };
    }

    protected highlight(cellView: dia.CellView): void {
        const { model } = cellView;
        if (!model.isElement()) {
            return;
        }
        this.renderChildren();
        const isOpen = Boolean(dataOf(model, 'open'));
        this.placeBeside(model, TOGGLE_SIZE.width, TOGGLE_SIZE.height);
        this.getNode('switch', HTMLDivElement)?.setAttribute('aria-label', this.getElementName(model));
        // The state it is in: pressed (a segmented control, see `runtime.css`); the state asked for: pending
        this.updatePending(model);
        const asked = this.pending?.value;
        ([['buttonOn', true], ['buttonOff', false]] as const).forEach(([selector, open]) => {
            const button = this.getNode(selector, HTMLButtonElement);
            button?.setAttribute('aria-pressed', String(isOpen === open));
            button?.toggleAttribute('data-pending', asked === open);
        });
        this.updateInert(cellView);
    }

    /** The state of the button (open or closed) asked for, unless the valve is in it */
    onButtonClick(evt: dia.Event): void {
        const { model } = this.cellView;
        const { currentTarget } = evt;
        if (!model.isElement() || !(currentTarget instanceof HTMLElement)) {
            return;
        }
        const open = currentTarget.dataset.open === 'true';
        if (open !== readProperty(model, 'open')) {
            this.request('open', open);
        }
    }
}

/** A slider that sets how much a control valve is open. */
class SliderValveControl extends Control {

    preinitialize(): void {
        // `controlPosition`, `angle`, `size`, `flip`: beside the valve, clear of its drawing (see `placeBeside()`)
        this.UPDATE_ATTRIBUTES = ['data', 'controlPosition', 'angle', 'size', 'flip'];
        this.children = sliderValveControlMarkup;
    }

    events(): mvc.EventsHash {
        // Moved: the value shown on the slider; released: the command sent
        return { 'input input': 'onInput', 'change input': 'onChange' };
    }

    /** The slider is moved (not following the valve until it is released) */
    protected moving = false;

    protected highlight(cellView: dia.CellView): void {
        const { model } = cellView;
        if (!model.isElement()) {
            return;
        }
        const open = dataOf<number>(model, 'open') ?? 0;
        if (!this.childNodes) {
            // Render the slider only once so that the user can keep dragging it.
            this.renderChildren();
        }
        this.placeBeside(model, SLIDER_SIZE.width, SLIDER_SIZE.height);
        // The valve as the plant says (not while the slider is moved), or how much open asked for (pending)
        this.updatePending(model);
        if (!this.moving) {
            const asked = this.pending ? Number(this.pending.value) / 100 : null;
            const slider = this.getNode('slider', HTMLInputElement);
            const value = this.getNode('value', HTMLOutputElement);
            if (slider) {
                slider.value = String((asked ?? open) * 100);
                slider.setAttribute('aria-label', `${this.getElementName(model)} opening`);
            }
            if (value) {
                value.textContent = asked === null ? getOpenText(open) : `→ ${getOpenText(asked)}`;
            }
        }
        this.updateInert(cellView);
    }

    onInput(evt: dia.Event): void {
        const { target } = evt;
        const value = this.getNode('value', HTMLOutputElement);
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        this.moving = true;
        if (value) {
            value.textContent = getOpenText(Number(target.value) / 100);
        }
    }

    /** Released: how much open asked for (in %); the slider stays there until the plant moves the valve */
    onChange(evt: dia.Event): void {
        const { target } = evt;
        this.moving = false;
        if (target instanceof HTMLInputElement) {
            this.request('open', Number(target.value));
        }
    }
}

function getOpenText(open: number): string {
    if (open === 0) {
        return 'Closed';
    }
    if (open === 1) {
        return 'Open';
    }
    return `${open * 100}% open`;
}

const CONTROL_HIGHLIGHTER_ID = 'control';

/** The control of the element of the view, if it has one (see `updateControl()`) */
export function getControl(view: dia.CellView): dia.HighlighterView | null {
    return dia.HighlighterView.get(view, CONTROL_HIGHLIGHTER_ID);
}

/** Whether the element has a control (it can be turned off in the inspector). */
export function hasControl(element: dia.Element): element is Shape {
    return Shape.isShape(element) && element.control !== null;
}

/** Whether the control of the element is shown (the default). */
export function usesControl(element: dia.Element): boolean {
    return hasControl(element) && element.get('controls') !== false;
}

/** Show the control of the element, or remove it if the element doesn't use one (any more). */
export function updateControl(paper: dia.Paper, element: dia.Element): void {
    const elementView = element.findView(paper);
    if (!elementView) {
        return;
    }
    dia.HighlighterView.remove(elementView, CONTROL_HIGHLIGHTER_ID);
    if (!hasControl(element) || !usesControl(element)) {
        return;
    }
    // In the front layer of the paper: over the shapes, upright (see `Control.transform()`)
    const options = { layer: dia.Paper.Layers.FRONT };
    switch (element.control) {
        case 'power':
            PumpControl.add(elementView, 'root', CONTROL_HIGHLIGHTER_ID, options);
            break;
        case 'toggle':
            ToggleValveControl.add(elementView, 'root', CONTROL_HIGHLIGHTER_ID, options);
            break;
        case 'slider':
            SliderValveControl.add(elementView, 'root', CONTROL_HIGHLIGHTER_ID, options);
            break;
    }
}

export function addControls(paper: dia.Paper): void {
    paper.model.getElements().forEach(element => updateControl(paper, element));
}

/** The controls can be operated (in the runtime mode) or not (inert, while editing). */
export function setControlsOperable(paper: dia.Paper, value: boolean): void {
    operable.set(paper, value);
    addControls(paper);
}

export function removeControls(paper: dia.Paper): void {
    dia.HighlighterView.removeAll(paper, CONTROL_HIGHLIGHTER_ID);
}

/**
 * How far the control of the element reaches out of its drawing on the side (with the gap), if it is there - beside
 * the element (a switch, a slider: see `Control.placeBeside()`; a checkbox is in its corner); 0 otherwise
 */
export function controlReach(element: dia.Element, side: 'top' | 'bottom'): number {
    if (!hasControl(element) || !usesControl(element) || sideOf(element.get('controlPosition')) !== side) {
        return 0;
    }
    const size = element.control === 'toggle' ? TOGGLE_SIZE : element.control === 'slider' ? SLIDER_SIZE : null;
    return size ? size.height + CONTROL_GAP : 0;
}
