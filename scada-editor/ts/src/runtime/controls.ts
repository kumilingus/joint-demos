import { dia, util, type mvc } from '@joint/plus';
import Shape from '../shapes/common/Shape';
import { besideElement, seenBBox, sideOf } from '../shapes/attributes/label';
import { readProperty, type TagValue, writeProperty } from '../plant/properties';

/*
 * The controls of the equipment: highlighters embedding HTML form controls
 * in a `foreignObject`. They are shown in both modes, but can be operated
 * in the runtime mode only: while editing they are inert (not focused, not clicked - the pointer goes through to
 * the element, to select it or to move it) and dimmed (`.jj-control-inert` in `runtime.css`).
 * In the runtime mode the paper ignores the events on them (its `guard`, see `app.ts`).
 */

/**
 * The option of the changes made in the runtime mode (by operating the equipment or by the plant,
 * see `plant/mock/`), not by editing the diagram: they are not recorded in the history.
 */
export const RUNTIME = { runtime: true };

/** The option of a command of the operator (a runtime change too): sent to the plant (see `ControlsController`) */
export const COMMAND = { ...RUNTIME, command: true };

/** A command of the operator: the new value of the property of the element (see `properties.ts`) */
function command(element: dia.Element, property: string, value: TagValue): void {
    writeProperty(element, property, value, COMMAND);
}

// The sizes of the controls beside the element (their `foreignObject`s below), the space between them and the element
const TOGGLE_SIZE = { width: 100, height: 30 };
const SLIDER_SIZE = { width: 100, height: 42 };
const CONTROL_GAP = 6;

/** The class of the root of every control. */
const CONTROL_CLASS = 'jj-control';

/** Whether the event started on a control (and not on the element under it). */
export function isControlEvent(evt: dia.Event): boolean {
    return evt.target instanceof Element && evt.target.closest(`.${CONTROL_CLASS}`) !== null;
}

/** The markup of the controls (parsed once, shared by all of them) */
const pumpControlMarkup = util.svg/* xml */`
    <foreignObject class="${CONTROL_CLASS}" width="20" height="20">
        <div class="jj-checkbox" xmlns="http://www.w3.org/1999/xhtml">
            <input @selector="input" class="jj-checkbox-input" type="checkbox"/>
        </div>
    </foreignObject>
`;

const toggleValveControlMarkup = util.svg/* xml */`
    <foreignObject class="${CONTROL_CLASS}" width="${TOGGLE_SIZE.width}" height="${TOGGLE_SIZE.height}">
        <div class="jj-switch" xmlns="http://www.w3.org/1999/xhtml">
            <button @selector="buttonOn" class="jj-switch-on" data-open="true">Open</button>
            <button @selector="buttonOff" class="jj-switch-off" data-open="false">Closed</button>
        </div>
    </foreignObject>
`;

const sliderValveControlMarkup = util.svg/* xml */`
    <foreignObject class="${CONTROL_CLASS}" width="${SLIDER_SIZE.width}" height="${SLIDER_SIZE.height}">
        <div class="jj-slider" xmlns="http://www.w3.org/1999/xhtml">
            <input @selector="slider" class="jj-slider-input" type="range" min="0" max="100" step="25"/>
            <output @selector="value" class="jj-slider-output"></output>
        </div>
    </foreignObject>
`;

/** Whether the controls of the paper can be operated (in the runtime mode, see `setControlsOperable()`). */
const operable = new WeakMap<dia.Paper, boolean>();

abstract class Control extends dia.HighlighterView {

    /**
     * Inert unless the controls of its paper can be operated (the HTML content: `inert` is an HTML attribute); the
     * pointer through it then (to the element under it), the control dimmed
     */
    protected updateInert(cellView: dia.CellView): void {
        const inert = !operable.get(cellView.paper!);
        this.el.classList.toggle('jj-control-inert', inert);
        this.el.querySelectorAll('foreignObject > *').forEach(node => node.toggleAttribute('inert', inert));
    }

    /** The nodes of `children` by their `@selector`. */
    protected get nodes(): Record<string, HTMLElement> {
        return this.childNodes as Record<string, HTMLElement>;
    }

    /**
     * Upright: in a layer of the paper (see `updateControl()`), moved with the element but not rotated with it
     * (the built-in transform of a highlighter in a layer is the translation and the rotation of the element).
     */
    protected transform(): void {
        const { transformGroup, cellView } = this;
        if (!transformGroup) return;
        const { x, y } = (cellView.model as dia.Element).position();
        transformGroup.attr('transform', `translate(${x},${y})`);
    }

    /** Place the control at the point (in the coordinates of the element as it is seen, see `transform()`) */
    protected place(x: number, y: number): void {
        this.el.setAttribute('transform', `translate(${x},${y})`);
    }

    /** Place the control in the top left corner of the element as it is seen (rotated) */
    protected placeInCorner(element: dia.Element): void {
        const { x, y } = seenBBox(element);
        this.place(x + 5, y + 5);
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
        // `angle`, `size`: in the corner as it is seen
        this.UPDATE_ATTRIBUTES = ['power', 'angle', 'size'];
        this.tagName = 'g';
        this.children = pumpControlMarkup;
    }

    events(): mvc.EventsHash {
        return { 'change input': 'onChange' };
    }

    protected highlight(cellView: dia.CellView): void {
        this.renderChildren();
        this.placeInCorner(cellView.model as dia.Element);
        (this.nodes.input as HTMLInputElement).checked = Boolean(cellView.model.get('power'));
        this.updateInert(cellView);
    }

    onChange(evt: dia.Event): void {
        command(this.cellView.model as dia.Element, 'power', (evt.target as HTMLInputElement).checked);
    }
}

/** Open / close buttons of a hand valve (a ball valve, ...). */
class ToggleValveControl extends Control {

    preinitialize(): void {
        // `controlPosition`, `angle`, `size`: beside the valve (see `placeBeside()`)
        this.UPDATE_ATTRIBUTES = ['open', 'controlPosition', 'angle', 'size'];
        this.children = toggleValveControlMarkup;
    }

    events(): mvc.EventsHash {
        return { 'click button': 'onButtonClick' };
    }

    protected highlight(cellView: dia.CellView): void {
        this.renderChildren();
        const model = cellView.model as dia.Element;
        const isOpen = Boolean(model.get('open'));
        const { buttonOn, buttonOff } = this.nodes;
        this.placeBeside(model, TOGGLE_SIZE.width, TOGGLE_SIZE.height);
        // The state it is in: pressed (a segmented control, see `runtime.css`)
        buttonOn.setAttribute('aria-pressed', String(isOpen));
        buttonOff.setAttribute('aria-pressed', String(!isOpen));
        this.updateInert(cellView);
    }

    /** The state of the button (open or closed), unless the valve is in it */
    onButtonClick(evt: dia.Event): void {
        const model = this.cellView.model as dia.Element;
        const open = (evt.currentTarget as HTMLElement).dataset.open === 'true';
        if (open !== readProperty(model, 'open')) command(model, 'open', open);
    }
}

/** A slider that sets how much a control valve is open. */
class SliderValveControl extends Control {

    preinitialize(): void {
        // `controlPosition`, `angle`, `size`: beside the valve (see `placeBeside()`)
        this.UPDATE_ATTRIBUTES = ['open', 'controlPosition', 'angle', 'size'];
        this.children = sliderValveControlMarkup;
    }

    events(): mvc.EventsHash {
        // Moved: the valve follows; released: the command sent
        return { 'input input': 'onInput', 'change input': 'onChange' };
    }

    protected highlight(cellView: dia.CellView): void {
        const model = cellView.model as dia.Element;
        const open = model.get('open') ?? 0;
        if (!this.childNodes) {
            // Render the slider only once so that the user can keep dragging it.
            this.renderChildren();
        }
        // Follow the changes (from the plant too), but not while the user is dragging the slider.
        const slider = this.nodes.slider as HTMLInputElement;
        if (document.activeElement !== slider) slider.value = String(open * 100);
        this.placeBeside(model, SLIDER_SIZE.width, SLIDER_SIZE.height);
        this.nodes.value.textContent = getOpenText(open);
        this.updateInert(cellView);
    }

    /** How much the valve was open before the slider was moved (see `onChange()`) */
    protected openBefore: number | undefined;

    onInput(evt: dia.Event): void {
        const { model } = this.cellView;
        this.openBefore ??= model.get('open') ?? 0;
        model.set('open', Number((evt.target as HTMLInputElement).value) / 100, RUNTIME);
    }

    /**
     * Released: the command - a change from how much it was open before (the valve followed the slider while it was
     * moved: as it is now, it wouldn't be a change), put back silently first
     */
    onChange(evt: dia.Event): void {
        const model = this.cellView.model as dia.Element;
        if (this.openBefore !== undefined) model.set('open', this.openBefore, { ...RUNTIME, silent: true });
        this.openBefore = undefined;
        command(model, 'open', Number((evt.target as HTMLInputElement).value));
    }
}

function getOpenText(open: number): string {
    if (open === 0) return 'Closed';
    if (open === 1) return 'Open';
    return `${open * 100}% open`;
}

const CONTROL_HIGHLIGHTER_ID = 'control';

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
    if (!elementView) return;
    dia.HighlighterView.remove(elementView, CONTROL_HIGHLIGHTER_ID);
    if (!hasControl(element) || !usesControl(element)) return;
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
