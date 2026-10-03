import { ui, util, type dia } from '@joint/plus';
import { hasControl } from './controls';
import { isRouted } from './shapes/routing';
import { LAYER_NAMES } from './layers';
import { renderLabel } from './help';
import { accentFieldOf, colorFieldOf, fieldDefault, getColorFieldValue, outlineFieldOf, rememberColor, renderColorField } from './color-field';
import type { ColorField } from './shapes/Shape';
import { isGroup } from './shapes/Group';
import { appearanceTargets, createAppearanceInspector } from './selection-inspector';
import { hasFinish } from './shapes/gradients';
import { type Arrowhead, arrowheadMarker } from './shapes/Arrow';
import { descriptions } from './descriptions';
import { MAX_SLICES } from './shapes/DonutChart';

const groups: ui.Inspector.Options['groups'] = {
    general: { label: 'General', index: 1 },
    // Named after the kind of the link (see `LINK_NAMES`)
    link: { label: 'Pipe', index: 1 },
    // How the element looks: its color, its finish, the size of a text, ...
    appearance: { label: 'Appearance', index: 2 },
    values: { label: 'Values', index: 3 },
    slices: { label: 'Slices', index: 3 },
    thresholds: { label: 'Thresholds', index: 4 },
    controls: { label: 'Controls', index: 5 }
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

/** The elements a table can show the values of: those with an ID (not the tables, the labels, the groups, the background), by the ID */
function sourceOptions(table: dia.Element): Array<{ value: string; content: string }> {
    const elements = table.graph?.getElements() ?? [];
    return elements
        .filter(element => element.get('tag') && !['Table', 'Label', 'Group', 'Screen', 'Zone', 'CustomImage', 'Rectangle', 'Ellipse'].includes(element.get('type')))
        .map((element) => {
            const tag = String(element.get('tag'));
            const name = element.attr('label/text') || descriptions[element.get('type')]?.title || element.get('type');
            return { value: tag, content: `${tag} ${name}` };
        })
        .sort((a, b) => a.value.localeCompare(b.value));
}

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

    // A label (a text on its own) and a zone have a size, a style and a weight of the text too.
    if (['Label', 'Zone'].includes(element.get('type'))) {
        inputs.attrs = {
            ...(inputs.attrs as Inputs),
            label: {
                ...(inputs.attrs as Record<string, Inputs>).label,
                fontSize: { type: 'number', label: 'Font size', min: 8, max: 72, group: 'appearance', index: index++ },
                // Several at once: an array (see `textStyles`)
                textStyles: {
                    type: 'select-button-group',
                    label: 'Font style',
                    multi: true,
                    // The array replaced (not merged into the one before: an unselected style is gone)
                    overwrite: true,
                    options: [
                        { value: 'italic', content: '<em>Italic</em>' },
                        { value: 'underline', content: '<u>Underline</u>' },
                        { value: 'line-through', content: '<s>Strike</s>' }
                    ],
                    group: 'appearance',
                    index: index++
                },
                fontWeight: {
                    type: 'select-button-group',
                    label: 'Font weight',
                    options: [
                        { value: 400, content: 'Normal' },
                        { value: 600, content: 'Semibold' },
                        { value: 700, content: 'Bold' }
                    ],
                    group: 'appearance',
                    index: index++
                }
            }
        };
    }

    // The finish of the surfaces (see `SurfaceFinish`): first, it decides how their color is drawn
    if (hasFinish(element)) {
        inputs.finish = {
            type: 'select-button-group',
            label: 'Finish',
            // Auto: none of its own - the finish of the diagram (its style)
            options: [
                { value: 'auto', content: 'Auto' },
                { value: 'shaded', content: 'Shaded' },
                { value: 'flat', content: 'Flat' }
            ],
            defaultValue: 'auto',
            group: 'appearance',
            index: index++
        };
    }

    // The color the user sets (see `ColorField`): of the fills of the surfaces
    util.merge(inputs, colorInputs(element, 'appearance', index++));

    // Their outline (none of its own: as the shape draws it)
    util.merge(inputs, outlineInputs(element, 'appearance', index++));
    util.merge(inputs, accentInputs(element, 'appearance', index++));
    // The accent of a table: its head - only while the names of the columns are shown
    if (element.get('type') === 'Table') {
        util.merge(inputs, { headerFill: { when: { eq: { names: true }}}});
    }

    // A shape of the background: its opacity
    if (['Rectangle', 'Ellipse'].includes(element.get('type'))) {
        util.merge(inputs, {
            attrs: { body: { fillOpacity: { type: 'range', label: 'Opacity', min: 0, max: 1, step: 0.05, group: 'appearance', index: index++ }}}
        });
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
                        { value: 'right', content: 'Right' },
                        { value: 'top', content: 'Top' },
                        { value: 'bottom', content: 'Bottom' }
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

    // A table: its title (with a header), its columns (their names shown or not, the kinds of their values);
    // its rows are set by resizing it (their values from the plant)
    if (element.get('type') === 'Table') {
        inputs.header = { type: 'toggle', label: 'Header', group: 'general', index: index++ };
        inputs.title = { type: 'text', label: 'Title', when: { eq: { header: true }}, group: 'general', index: index++ };
        inputs.names = { type: 'toggle', label: 'Column names', group: 'general', index: index++ };
        // The element whose values it shows, by its ID (its states follow it in the runtime mode): of those in the diagram now
        // (not `source`: a link's - the graph takes a change of it for a reconnected link)
        inputs.sourceTag = {
            type: 'select',
            label: 'Source',
            options: [{ value: '', content: 'None' }, ...sourceOptions(element)],
            group: 'values',
            index: index++
        };
        inputs.columns = {
            type: 'list',
            label: 'Columns',
            addButtonLabel: 'Add column',
            min: 1,
            item: {
                type: 'object',
                properties: {
                    name: { type: 'text', label: 'Name', defaultValue: 'Column', index: 1 },
                    kind: {
                        type: 'select-button-group',
                        label: 'Kind',
                        defaultValue: 'number',
                        options: [
                            { value: 'text', content: 'Text' },
                            { value: 'number', content: 'Number' },
                            { value: 'state', content: 'State' }
                        ],
                        index: 2
                    },
                    // Empty (or 0): auto - a share of the width left
                    width: { type: 'number', label: 'Width', min: 0, step: 10, attrs: { input: { placeholder: 'auto' }}, index: 3 }
                }
            },
            group: 'values',
            index: index++
        };
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

/**
 * The Color field of the cell, at the path of its color (see `ColorField`): the surfaces of the equipment, the fill
 * of a background shape, the text of a label, the medium of a pipe, a wire, ...; nothing if it has none.
 */
function colorInputs(cell: dia.Cell, group: string, index: number): Inputs {
    const field = colorFieldOf(cell);
    if (!field) return {};
    const { path, defaultValue } = field;
    const input = { type: 'color', label: 'Color', group, index, ...(defaultValue ? { defaultValue } : {}) };
    return path.reduceRight<Inputs>((nested, key) => ({ [key]: nested }), input as unknown as Inputs);
}

/**
 * The Outline field of the cell, at the path of its outline color (see `outlineField`): of the surfaces of
 * the equipment (Auto - as the shape draws them), of a pipe (its default the dark of the theme); nothing if none.
 */
function outlineInputs(cell: dia.Cell, group: string, index: number): Inputs {
    return fieldInputs(cell, outlineFieldOf(cell), 'Outline', group, index);
}

/** The Accent field of the cell (a marking of it: the bands of a stack, a handwheel, see `accentField`); nothing if none */
function accentInputs(cell: dia.Cell, group: string, index: number): Inputs {
    return fieldInputs(cell, accentFieldOf(cell), 'Accent', group, index);
}

/** A color field at the path of the field (Auto if it has no default: none of the cell's own) */
function fieldInputs(cell: dia.Cell, field: ColorField | null, label: string, group: string, index: number): Inputs {
    if (!field) return {};
    const input = { type: 'color', label, group, index, ...(fieldDefault(cell, field) === undefined ? { auto: true } : {}) };
    return field.path.reduceRight<Inputs>((nested, key) => ({ [key]: nested }), input as unknown as Inputs);
}

/** An arrowhead as a button: a short line ending with it (pointing outwards: left at the start, right at the end) */
function arrowheadIcon(arrowhead: Arrowhead, end: 'source' | 'target'): string {
    const marker = arrowheadMarker(arrowhead);
    const head = marker
        ? (marker.type === 'circle'
            ? `<circle cx="20" cy="7" r="${marker.r}" />`
            : `<path d="${marker.d}" transform="translate(20 7) rotate(180)" fill="${marker.fill ?? 'currentColor'}" stroke-width="${marker['stroke-width']}" stroke-linejoin="round" />`)
        : '';
    const flip = end === 'source' ? ' transform="matrix(-1 0 0 1 26 0)"' : '';
    return `<svg width="26" height="14" viewBox="0 0 26 14" fill="currentColor" stroke="currentColor" aria-label="${arrowhead}"><title>${ARROWHEAD_NAMES[arrowhead]}</title><g${flip}><path d="M 2 7 H 20" stroke-width="2" stroke-linecap="round" />${head}</g></svg>`;
}

const ARROWHEAD_NAMES: Record<Arrowhead, string> = { none: 'None', arrow: 'Arrow', open: 'Open arrow', circle: 'Circle', diamond: 'Diamond' };

const arrowheadInput = (end: 'source' | 'target', label: string, index: number) => ({
    type: 'select-button-group',
    label,
    options: (Object.keys(ARROWHEAD_NAMES) as Arrowhead[]).map(value => ({ value, content: arrowheadIcon(value, end) })),
    group: 'link',
    index
});

/** The arrowheads of an arrow at its ends (see `Arrow`) */
const arrowheadInputs: Inputs = {
    sourceArrowhead: arrowheadInput('source', 'Start', 3),
    targetArrowhead: arrowheadInput('target', 'End', 4)
};

/** What the user calls the links: a pipe carries the medium, a signal line the measurement, a wire the power, an arrow points, a conveyor carries the bulk material. */
const LINK_NAMES: Record<string, string> = {
    Pipe: 'Pipe',
    SignalLine: 'Signal line',
    Wire: 'Wire',
    Arrow: 'Arrow',
    Conveyor: 'Conveyor'
};

/** The layer of the graph the cell is in (moved between them when changed, see `layers.ts`): last of its appearance. */
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
    if (cell.isElement()) return { ...getInputs(cell), ...layerInput('appearance') };
    // Merged deeply: the color and the outline of a pipe are both in its `attrs`
    return util.merge(
        {},
        isRouted(cell) ? linkInputs : {},
        colorInputs(cell, 'link', 2),
        outlineInputs(cell, 'link', 3),
        accentInputs(cell, 'link', 4),
        cell.get('type') === 'Arrow' ? arrowheadInputs : {},
        // A conveyor runs or stands still
        cell.has('power') ? { power: { type: 'toggle', label: 'Power', group: 'link', index: 5 }} : {},
        layerInput('link')
    ) as Inputs;
}

/** The inspector of the appearance of several cells (see `selection-inspector.ts`), if one is open */
let appearance: ui.Inspector | null = null;

/** Open the inspector of the appearance of the cells (see `selection-inspector.ts`) in the element, with a note under its heading */
function openAppearanceInspector(el: HTMLElement, cells: dia.Cell[], label: string, note?: string): void {
    const inspector = createAppearanceInspector(cells, label);
    if (!inspector) return;
    inspector.render();
    if (note) {
        const noteEl = document.createElement('p');
        noteEl.className = 'appearance-note';
        noteEl.textContent = note;
        inspector.el.querySelector('.group-label')?.after(noteEl);
    }
    el.append(inspector.el);
    trackPickedColors(inspector.el);
    appearance = inspector;
}

/** Open the inspector of several selected cells: their appearance at once (a group for its members) */
export function openSelectionInspector(el: HTMLElement, cells: dia.Cell[]): void {
    closeInspector();
    openAppearanceInspector(el, appearanceTargets(cells), `Appearance · ${cells.length} selected`);
}

/** Open the inspector of the cell; a click on a member of a group selects it (`onMemberSelect`). */
export function openInspector(el: HTMLElement, cell: dia.Cell, onMemberSelect?: (member: dia.Cell) => void): void {
    closeInspector();
    selectMember = onMemberSelect ?? null;
    const linkName = LINK_NAMES[cell.get('type')] ?? 'Pipe';
    const inspector = ui.Inspector.create(el, {
        cell,
        inputs: inspectorInputs(cell),
        // The first group named after the kind of the shape (as in the palette, see `descriptions.ts`)
        groups: {
            ...groups,
            general: { ...groups!.general, label: descriptions[cell.get('type')]?.title ?? groups!.general.label },
            link: { ...groups!.link, label: linkName }
        },
        renderLabel,
        // The color fields with the swatches of the colors to pick again (see `color-field.ts`), the members of a group
        renderFieldContent,
        getFieldValue
    });
    trackPickedColors(inspector.el);
    // A group: the appearance of its members, set now (it has none of its own) - under its fields, in its inspector
    if (isGroup(cell)) {
        openAppearanceInspector(inspector.el, appearanceTargets([cell]), 'Members\' appearance',
            'Sets the members as they are now: the group has no color of its own, a shape added to it later keeps its own.');
    }
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
    if (appearance) {
        savePickedColors(appearance.el);
        appearance.remove();
        appearance = null;
    }
}
