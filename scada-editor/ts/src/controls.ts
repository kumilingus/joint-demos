import { dia, util, type mvc } from '@joint/plus';
import { Shape } from './shapes/Shape';

/*
 * The controls of the equipment: highlighters embedding HTML form controls
 * in a `foreignObject`. They are shown in both modes, but can be operated
 * in the runtime mode only: while editing they are inert (not focused, not clicked -
 * the pointer goes through to the element, to select it or to move it).
 */

/**
 * The option of the changes made in the runtime mode (by operating the equipment or by the plant,
 * see `simulation.ts`), not by editing the diagram: they are not recorded in the history.
 */
export const RUNTIME = { runtime: true };

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
    <foreignObject class="${CONTROL_CLASS}" width="100" height="50">
        <div class="jj-switch" xmlns="http://www.w3.org/1999/xhtml">
            <div @selector="label" class="jj-switch-label"></div>
            <button @selector="buttonOn" class="jj-switch-on">open</button>
            <button @selector="buttonOff" class="jj-switch-off">close</button>
        </div>
    </foreignObject>
`;

const sliderValveControlMarkup = util.svg/* xml */`
    <foreignObject class="${CONTROL_CLASS}" width="100" height="60">
        <div class="jj-slider" xmlns="http://www.w3.org/1999/xhtml">
            <div @selector="label" class="jj-slider-label"></div>
            <input @selector="slider" class="jj-slider-input" type="range" min="0" max="100" step="25"/>
            <output @selector="value" class="jj-slider-output"></output>
        </div>
    </foreignObject>
`;

/** Whether the controls of the paper can be operated (in the runtime mode, see `setControlsOperable()`). */
const operable = new WeakMap<dia.Paper, boolean>();

abstract class Control extends dia.HighlighterView {

    /** Inert unless the controls of its paper can be operated (the HTML content: `inert` is an HTML attribute). */
    protected updateInert(cellView: dia.CellView): void {
        const inert = !operable.get(cellView.paper!);
        this.el.querySelectorAll('foreignObject > *').forEach(node => node.toggleAttribute('inert', inert));
    }

    /** The nodes of `children` by their `@selector`. */
    protected get nodes(): Record<string, HTMLElement> {
        return this.childNodes as Record<string, HTMLElement>;
    }

    /** Place the control centered below the element. */
    protected placeBelow(element: dia.Element): void {
        const { width, height } = element.size();
        this.el.setAttribute('transform', `translate(${width / 2 - 50}, ${height + 10})`);
    }
}

/** A checkbox that turns a pump (a motor, a beacon, ...) on and off. */
class PumpControl extends Control {

    preinitialize(): void {
        this.UPDATE_ATTRIBUTES = ['power'];
        this.tagName = 'g';
        this.children = pumpControlMarkup;
        this.attributes = {
            transform: 'translate(5, 5)'
        };
    }

    events(): mvc.EventsHash {
        return { 'change input': 'onChange' };
    }

    protected highlight(cellView: dia.CellView): void {
        this.renderChildren();
        (this.nodes.input as HTMLInputElement).checked = Boolean(cellView.model.get('power'));
        this.updateInert(cellView);
    }

    onChange(evt: dia.Event): void {
        this.cellView.model.set('power', (evt.target as HTMLInputElement).checked ? 1 : 0, RUNTIME);
    }
}

/** Open / close buttons of a hand valve (a ball valve, ...). */
class ToggleValveControl extends Control {

    preinitialize(): void {
        // `attrs`: the label of the valve is shown (and can be edited in the edit mode).
        this.UPDATE_ATTRIBUTES = ['open', 'attrs'];
        this.children = toggleValveControlMarkup;
    }

    events(): mvc.EventsHash {
        return { 'click button': 'onButtonClick' };
    }

    protected highlight(cellView: dia.CellView): void {
        this.renderChildren();
        const model = cellView.model as dia.Element;
        const isOpen = Boolean(model.get('open'));
        const { buttonOn, buttonOff, label } = this.nodes;
        this.placeBelow(model);
        (buttonOn as HTMLButtonElement).disabled = !isOpen;
        (buttonOff as HTMLButtonElement).disabled = isOpen;
        label.textContent = model.attr('label/text');
        this.updateInert(cellView);
    }

    onButtonClick(): void {
        const { model } = this.cellView;
        model.set('open', !model.get('open'), RUNTIME);
    }
}

/** A slider that sets how much a control valve is open. */
class SliderValveControl extends Control {

    preinitialize(): void {
        // `attrs`: the label of the valve is shown (and can be edited in the edit mode).
        this.UPDATE_ATTRIBUTES = ['open', 'attrs'];
        this.children = sliderValveControlMarkup;
    }

    events(): mvc.EventsHash {
        return { 'input input': 'onInput' };
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
        this.placeBelow(model);
        this.nodes.label.textContent = model.attr('label/text');
        this.nodes.value.textContent = getOpenText(open);
        this.updateInert(cellView);
    }

    onInput(evt: dia.Event): void {
        this.cellView.model.set('open', Number((evt.target as HTMLInputElement).value) / 100, RUNTIME);
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
    switch (element.control) {
        case 'power':
            PumpControl.add(elementView, 'root', CONTROL_HIGHLIGHTER_ID);
            break;
        case 'toggle':
            ToggleValveControl.add(elementView, 'root', CONTROL_HIGHLIGHTER_ID);
            break;
        case 'slider':
            SliderValveControl.add(elementView, 'root', CONTROL_HIGHLIGHTER_ID);
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
