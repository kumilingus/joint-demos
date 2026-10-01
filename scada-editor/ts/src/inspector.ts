import { ui, type dia } from '@joint/plus';
import { hasControl } from './controls';
import { isRouted } from './shapes/routing';
import { LAYER_NAMES } from './layers';
import { renderLabel } from './help';
import { getColorFieldValue, rememberColor, renderColorField } from './color-field';
import { isGroup } from './shapes/Group';
import { descriptions } from './descriptions';
import { MAX_SLICES } from './shapes/DonutChart';

const groups: ui.Inspector.Options['groups'] = {
    general: { label: 'General', index: 1 },
    // Named after the kind of the link (see `LINK_NAMES`)
    link: { label: 'Pipe', index: 1 },
    values: { label: 'Values', index: 2 },
    slices: { label: 'Slices', index: 2 },
    thresholds: { label: 'Thresholds', index: 3 },
    controls: { label: 'Controls', index: 4 }
};

type Inputs = Record<string, unknown>;

/** The texts of the shapes that can be edited: [selector, label, group]. */
const TEXTS: Array<[string, string, string]> = [
    ['label', 'Label', 'general'],
    ['tag', 'Function', 'general'],
    ['loop', 'Loop', 'general'],
    ['value', 'Value', 'values'],
    ['unit', 'Unit', 'values']
];

/** The inputs for what the element has: its texts, its values and its control. */
function getInputs(element: dia.Element): Inputs {
    const inputs: Inputs = {};
    let index = 0;

    inputs.tag = { type: 'text', label: 'ID', group: 'general', index: index++ };

    const attrs: Inputs = {};
    TEXTS.forEach(([selector, label, group]) => {
        if (element.attr([selector, 'text']) === undefined) return;
        attrs[selector] = { text: { type: 'text', label, group, index: index++ }};
    });
    if (Object.keys(attrs).length > 0) inputs.attrs = attrs;

    // A label (a text on its own) has a size and a color of the text too.
    if (element.get('type') === 'Label') {
        inputs.attrs = {
            ...(inputs.attrs as Inputs),
            label: {
                ...(inputs.attrs as Record<string, Inputs>).label,
                fontSize: { type: 'number', label: 'Font size', min: 8, max: 72, group: 'general', index: index++ },
                fill: { type: 'color', label: 'Color', group: 'general', index: index++ }
            }
        };
    }

    // A shape of the background: its color and its opacity
    if (['Rectangle', 'Ellipse'].includes(element.get('type'))) {
        const attrs = (inputs.attrs || {}) as Record<string, Inputs>;
        inputs.attrs = {
            ...attrs,
            body: {
                fill: { type: 'color', label: 'Color', group: 'general', index: index++ },
                fillOpacity: { type: 'range', label: 'Opacity', min: 0, max: 1, step: 0.05, group: 'general', index: index++ }
            }
        };
    }

    // A zone points to the side its pipe comes from (the outline of its body, see `Zone`).
    if (element.attr('body/tipSide') !== undefined) {
        const attrs = (inputs.attrs || {}) as Record<string, Inputs>;
        inputs.attrs = {
            ...attrs,
            body: {
                ...attrs.body,
                tipSide: {
                    type: 'select-button-group',
                    label: 'Tip',
                    options: [
                        { value: 'left', content: 'Left' },
                        { value: 'right', content: 'Right' }
                    ],
                    group: 'general',
                    index: index++
                }
            }
        };
    }

    if (element.has('power')) {
        inputs.power = { type: 'toggle', label: 'Power', group: 'values', index: index++ };
    }

    // A valve is either open or closed, or (a control valve) open by a part.
    const open = element.get('open');
    if (typeof open === 'boolean') {
        inputs.open = { type: 'toggle', label: 'Open', group: 'values', index: index++ };
    } else if (typeof open === 'number') {
        inputs.open = { type: 'range', label: 'Open', min: 0, max: 1, step: 0.25, group: 'values', index: index++ };
    }

    if (element.has('level')) {
        inputs.level = { type: 'range', label: 'Level', min: 0, max: 100, step: 1, unit: '%', group: 'values', index: index++ };
    }

    // The warning levels of a line chart: on its scale
    if (element.get('type') === 'LineChart') {
        inputs.thresholds = {
            low: { type: 'number', label: 'Low (warn below)', group: 'thresholds', index: index++ },
            high: { type: 'number', label: 'High (warn above)', group: 'thresholds', index: index++ }
        };
    // The levels at which a gauge turns to the warning colors.
    } else if (element.has('thresholds')) {
        inputs.thresholds = {
            low: { type: 'range', label: 'Low (warn below)', min: 0, max: 100, step: 1, unit: '%', group: 'thresholds', index: index++ },
            high: { type: 'range', label: 'High (warn above)', min: 0, max: 100, step: 1, unit: '%', group: 'thresholds', index: index++ }
        };
    }

    // The value on the scale of a thermometer or a pressure gauge
    const scaleLabel = ({ Thermometer: 'Temperature', PressureGauge: 'Pressure' } as Record<string, string>)[element.get('type')];
    if (scaleLabel) {
        inputs.value = { type: 'range', label: scaleLabel, min: 0, max: 100, step: 1, unit: '%', group: 'values', index: index++ };
    }

    // The scale of a gauge chart and the value on it
    if (element.get('type') === 'GaugeChart') {
        inputs.value = { type: 'number', label: 'Value', step: 0.1, group: 'values', index: index++ };
        inputs.min = { type: 'number', label: 'Min', group: 'values', index: index++ };
        inputs.max = { type: 'number', label: 'Max', group: 'values', index: index++ };
    }

    // The scale of a line or a bar chart (its values come from the plant)
    if (element.get('type') === 'LineChart' || element.get('type') === 'BarChart') {
        inputs.min = { type: 'number', label: 'Min', group: 'values', index: index++ };
        inputs.max = { type: 'number', label: 'Max', group: 'values', index: index++ };
    }

    // The slices of a donut chart: the parts of the whole (their shares are computed)
    if (element.has('slices')) {
        inputs.slices = {
            type: 'list',
            addButtonLabel: 'Add slice',
            max: MAX_SLICES,
            item: {
                type: 'object',
                properties: {
                    label: { type: 'text', label: 'Label', defaultValue: 'Other', index: 1 },
                    value: { type: 'number', label: 'Value', min: 0, defaultValue: 10, index: 2 },
                    color: { type: 'color', label: 'Color', defaultValue: '#60a5fa', index: 3 }
                }
            },
            group: 'slices',
            index: index++
        };
    }

    if (hasControl(element)) {
        inputs.controls = {
            type: 'toggle',
            label: 'Use controls',
            // Unless turned off, the element shows its control (it can be operated in the runtime mode).
            defaultValue: true,
            group: 'controls',
            index: index++
        };
    }

    return inputs;
}

/** A link (a pipe, a signal line) goes straight, in right angles or smoothly through its vertices (see `routing.ts`). */
const linkInputs: Inputs = {
    routing: {
        type: 'select-button-group',
        label: 'Routing',
        options: [
            { value: 'straight', content: 'Straight' },
            { value: 'orthogonal', content: 'Orthogonal' },
            { value: 'smooth', content: 'Curved' }
        ],
        group: 'link',
        index: 1
    }
};

/** The color of a link: of the medium a pipe carries, of a wire, of a signal line (the flow of the runtime mode is drawn over a pipe) */
const linkColorInputs: Inputs = {
    attrs: {
        line: {
            stroke: { type: 'color', label: 'Color', group: 'link', index: 2 }
        }
    }
};

/** What the user calls the links: a pipe carries the medium, a signal line the measurement, a wire the power. */
const LINK_NAMES: Record<string, string> = {
    Pipe: 'Pipe',
    SignalLine: 'Signal line',
    Wire: 'Wire'
};

/** The layer of the graph the cell is in (moved between them when changed, see `layers.ts`). */
const layerInput = (group: string) => ({
    layer: {
        type: 'select',
        label: 'Layer',
        options: Object.entries(LAYER_NAMES).map(([value, content]) => ({ value, content })),
        group,
        index: 100
    }
});

/** The inputs of a group: its ID and its members (no layer: nothing of it is drawn, see `Group`) */
const groupInputs: Inputs = {
    tag: { type: 'text', label: 'ID', group: 'general', index: 0 },
    members: { type: 'group-members', label: 'Members', group: 'general', index: 1 }
};

/** What a click on a member of a group in the inspector does (see `openInspector()`) */
let selectMember: ((cell: dia.Cell) => void) | null = null;

/**
 * The members of a group (the `renderFieldContent` of the inspector): the elements by their IDs and names,
 * a click on one selects it.
 */
function renderMembersField(options: { type?: string; label?: string }, _path: string, _value: unknown, inspector: ui.Inspector): HTMLElement | undefined {
    if (options.type !== 'group-members') return undefined;
    const el = document.createElement('div');
    el.className = 'group-members';
    const label = document.createElement('label');
    label.textContent = options.label ?? '';
    const list = document.createElement('ul');
    (inspector.options.cell as dia.Cell).getEmbeddedCells().filter(cell => cell.isElement()).forEach((member) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'group-member';
        const tag = document.createElement('span');
        tag.className = 'group-member-tag';
        tag.textContent = String(member.get('tag') ?? '');
        const name = isGroup(member) ? 'Group' : member.attr('label/text') || descriptions[member.get('type')]?.title || member.get('type');
        button.append(tag, ` ${name}`);
        button.addEventListener('click', () => selectMember?.(member));
        item.append(button);
        list.append(item);
    });
    el.append(label, list);
    return el;
}

/** The custom contents of the fields: the colors (see `color-field.ts`), the members of a group */
function renderFieldContent(...args: Parameters<typeof renderColorField>): HTMLElement | undefined {
    return renderColorField(...args) ?? renderMembersField(...args);
}

/** The value of a custom field: of a color one (the members of a group are read-only, no value) */
function getFieldValue(attribute: HTMLElement): { value: unknown } | undefined {
    if (attribute.classList.contains('group-members')) return { value: undefined };
    return getColorFieldValue(attribute);
}

/** The inputs of the cell: of a group, of an element, of a link */
function inspectorInputs(cell: dia.Cell): Inputs {
    if (isGroup(cell)) return groupInputs;
    if (cell.isElement()) return { ...getInputs(cell), ...layerInput('general') };
    return {
        ...(isRouted(cell) ? linkInputs : {}),
        ...(['Pipe', 'Wire', 'SignalLine'].includes(cell.get('type')) ? linkColorInputs : {}),
        ...layerInput('link')
    };
}

/** Open the inspector of the cell; a click on a member of a group selects it (`onMemberSelect`). */
export function openInspector(el: HTMLElement, cell: dia.Cell, onMemberSelect?: (member: dia.Cell) => void): void {
    closeInspector();
    selectMember = onMemberSelect ?? null;
    const linkName = LINK_NAMES[cell.get('type')] ?? 'Pipe';
    const inspector = ui.Inspector.create(el, {
        cell,
        inputs: inspectorInputs(cell),
        groups: { ...groups, link: { ...groups!.link, label: linkName }},
        renderLabel,
        // The color fields with the swatches of the colors to pick again (see `color-field.ts`), the members of a group
        renderFieldContent,
        getFieldValue
    });
    trackPickedColors(inspector.el);
}

/**
 * A color picked (the `input` of a color field, `change` when its picker closes) and not saved yet:
 * the inspector saves a field on its `change` (one step of the history, not one of each move in the picker).
 */
const PICKED = 'picked';

function onColorInput(evt: Event): void {
    const { target } = evt;
    if (target instanceof HTMLInputElement && target.type === 'color') target.dataset[PICKED] = 'true';
}

function onColorChange(evt: Event): void {
    const { target } = evt;
    if (!(target instanceof HTMLInputElement)) return;
    delete target.dataset[PICKED];
    // To be picked again (see `color-field.ts`)
    if (target.type === 'color') rememberColor(target.value);
}

/** Keep track of the colors picked in the inspector (its element), see `savePickedColors()` */
function trackPickedColors(el: Element): void {
    el.addEventListener('input', onColorInput);
    el.addEventListener('change', onColorChange);
}

/**
 * Save the colors picked in the inspector (its element) about to be removed: a click on the canvas removes it
 * while a color picker is open - the picker closes with it, without a `change`.
 */
function savePickedColors(el: Element): void {
    el.querySelectorAll<HTMLInputElement>(`input[type="color"][data-${PICKED}]`).forEach((input) => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

export function closeInspector(): void {
    const { instance } = ui.Inspector;
    if (instance) savePickedColors(instance.el);
    ui.Inspector.close();
}
