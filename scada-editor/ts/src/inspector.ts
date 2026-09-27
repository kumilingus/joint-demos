import { ui, type dia } from '@joint/plus';
import { hasControl } from './controls';
import { isRouted } from './shapes/routing';

const groups: ui.Inspector.Options['groups'] = {
    general: { label: 'General', index: 1 },
    link: { label: 'Link', index: 1 },
    values: { label: 'Values', index: 2 },
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

    // A label (a text on its own) has a size of the text too.
    if (element.get('type') === 'Label') {
        inputs.attrs = {
            ...(inputs.attrs as Inputs),
            label: {
                ...(inputs.attrs as Record<string, Inputs>).label,
                fontSize: { type: 'number', label: 'Font size', min: 8, max: 72, group: 'general', index: index++ }
            }
        };
    }

    // A zone points to the side its pipe comes from.
    if (element.has('facing')) {
        inputs.facing = {
            type: 'select-button-group',
            label: 'Facing',
            options: [
                { value: 'left', content: 'Left' },
                { value: 'right', content: 'Right' }
            ],
            group: 'general',
            index: index++
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

    // The levels at which a gauge turns to the warning colors.
    if (element.has('thresholds')) {
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
        group: 'link'
    }
};

export function openInspector(el: HTMLElement, cell: dia.Cell): void {
    closeInspector();
    ui.Inspector.create(el, {
        cell,
        inputs: cell.isElement() ? getInputs(cell as dia.Element) : isRouted(cell) ? linkInputs : {},
        groups
    });
}

export function closeInspector(): void {
    ui.Inspector.close();
}
