import { ui, type dia } from '@joint/plus';
import { hasControl } from './controls';
import { isRouted } from './shapes/routing';
import { Layer } from './const';

const groups: ui.Inspector.Options['groups'] = {
    general: { label: 'General', index: 1 },
    // Named after the kind of the link (see `LINK_NAMES`)
    link: { label: 'Pipe', index: 1 },
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

/** What the user calls the links: a pipe carries the medium, a signal line the measurement. */
const LINK_NAMES: Record<string, string> = {
    Pipe: 'Pipe',
    SignalLine: 'Signal line'
};

/** The layer of the graph the cell is in (moved between them when changed, see `layers.ts`). */
const layerInput = (group: string) => ({
    layer: {
        type: 'select',
        label: 'Layer',
        options: [
            { value: Layer.Foreground, content: 'Foreground' },
            { value: Layer.Instruments, content: 'Instruments' },
            { value: Layer.Equipment, content: 'Equipment' },
            { value: Layer.Pipes, content: 'Pipes' },
            { value: Layer.Background, content: 'Background' }
        ],
        group,
        index: 100
    }
});

export function openInspector(el: HTMLElement, cell: dia.Cell): void {
    closeInspector();
    const linkName = LINK_NAMES[cell.get('type')] ?? 'Pipe';
    ui.Inspector.create(el, {
        cell,
        inputs: cell.isElement()
            ? { ...getInputs(cell as dia.Element), ...layerInput('general') }
            : { ...(isRouted(cell) ? linkInputs : {}), ...layerInput('link') },
        groups: { ...groups, link: { ...groups!.link, label: linkName }}
    });
}

export function closeInspector(): void {
    ui.Inspector.close();
}
