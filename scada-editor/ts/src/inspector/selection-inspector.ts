import { dia, ui, util } from '@joint/plus';
import { accentFieldOf, colorFieldOf, fieldDefault, getColorFieldValue, isColorField, outlineFieldOf, renderColorField } from './color-field';
import { hasFinish, OUTLINE_WIDTHS, type SurfaceFinish } from '../shapes/common/gradients';
import Group from '../shapes/models/diagram/Group';
import { LAYER_NAMES } from '../canvas/layers';
import { renderLabel } from './help';
import { hasLineWidth, lineWidthField, type LineWidth } from '../shapes/common/line-width';
import { setStyle, styleOf, unsetStyle } from '../shapes/common/style';
import { getCellDefaults } from '../shapes/defaults';
import { keysOf } from '../keys';
import type { ColorField } from '../shapes/models/Shape';

/*
 * The appearance of several cells at once (a selection of them, the members of a group): an inspector
 * of a cell standing in for them all, with the fields they share - the color (of each its own: the metal
 * of a pump, the line of a pipe, the text of a label, see `ColorField`), the finish and the outline (of those with surfaces),
 * the width (of the pipes, the wires), their layer.
 * A field shows the value they all have, or none ("mixed") if they differ; a change sets it on all of them,
 * one step of the history.
 */

/**
 * The cells whose appearance the cells stand for: a group for its elements (in the groups in it too;
 * not its pipes: their color is their medium), any other cell for itself.
 */
export function appearanceTargets(cells: dia.Cell[]): dia.Cell[] {
    const targets = cells.flatMap(cell => (Group.isGroup(cell)
        ? cell.getEmbeddedCells({ deep: true }).filter(member => member.isElement() && !Group.isGroup(member))
        : [cell]));
    return [...new Set(targets)];
}

/** The outline widths to pick (see `OutlineWidth`): Auto (none of its own - of the diagram), thin, normal, thick */
export const OUTLINE_WIDTH_OPTIONS = [
    { value: 'auto', content: 'Auto' },
    ...keysOf(OUTLINE_WIDTHS).map(value => ({ value, content: OUTLINE_WIDTHS[value].name }))
];

/** The default color of the cell (of its shape) */
function defaultColorOf(cell: dia.Cell): unknown {
    const field = colorFieldOf(cell);
    if (!field) return undefined;
    const { path, defaultValue } = field;
    return util.getByPath(getCellDefaults(cell), path.join('/'), '/') ?? defaultValue;
}

/** The color of the cell as drawn: its own, or the default of its shape */
function colorOf(cell: dia.Cell): unknown {
    const field = colorFieldOf(cell);
    return field ? cell.prop(field.path) ?? defaultColorOf(cell) : undefined;
}

// Its own finish, or Auto (none of its own)
const finishOf = (cell: dia.Cell): string => styleOf<string>(cell, 'finish') ?? 'auto';

const AUTO = 'auto';

/** The outline color of the cell: its own, or the default of its shape; `undefined` - none (Auto) */
function outlineOf(cell: dia.Cell): string | undefined {
    const field = outlineFieldOf(cell);
    if (!field) return undefined;
    return cell.prop(field.path) ?? fieldDefault(cell, field);
}

/** The accent color of the cell: its own, or the default of its shape */
function accentOf(cell: dia.Cell): string | undefined {
    const field = accentFieldOf(cell);
    if (!field) return undefined;
    return cell.prop(field.path) ?? fieldDefault(cell, field);
}

/** The default accent color of the cell (of its shape) */
function accentDefaultOf(cell: dia.Cell): string | undefined {
    const field = accentFieldOf(cell);
    return field ? fieldDefault(cell, field) : undefined;
}

/** Set the color of the field of the cell, if it has the field */
function setField(cell: dia.Cell, field: ColorField | null, color: string): void {
    if (field) {
        cell.prop(field.path, color);
    }
}

/** Set the outline color of the cell, or none (`undefined`, Auto): back to the default of its shape, if it has one */
function setOutline(cell: dia.Cell, outline: string | undefined): void {
    const field = outlineFieldOf(cell);
    if (!field) return;
    const value = outline ?? fieldDefault(cell, field);
    if (value === undefined) {
        // The path as a string: `removeProp()` doesn't unset a top-level property given as an array
        cell.removeProp(field.path.join('/'));
    } else {
        cell.prop(field.path, value);
    }
}

/** The value all of them have, `undefined` if they differ */
function common<T>(values: T[]): T | undefined {
    return values.every(value => value === values[0]) ? values[0] : undefined;
}

/** Set something on the cells: one step of the history */
function changeAll(cells: dia.Cell[], change: (cell: dia.Cell) => void): void {
    const { graph } = cells[0];
    graph.startBatch('appearance');
    cells.forEach(change);
    graph.stopBatch('appearance');
}

/**
 * The inspector of the appearance of the cells (not rendered), in a group of the inspector with the label;
 * `null` if none of them has a color or a finish to set.
 */
export function createAppearanceInspector(cells: dia.Cell[], label: string, note?: string): ui.Inspector | null {
    const colored = cells.filter(cell => colorFieldOf(cell));
    const surfaced = cells.filter(cell => cell.isElement() && hasFinish(cell));
    const outlined = cells.filter(cell => outlineFieldOf(cell));
    const accented = cells.filter(cell => accentFieldOf(cell));
    const widened = cells.filter(hasLineWidth);
    // Outlined as one (see `outlineWidthInputs()` in `inspector.ts`): the pipes, the shapes that can be outlined - set
    // on those not outlined now too (it applies once they are: an outline color, flat)
    const bordered = cells.filter(cell => cell.get('type') === 'Pipe' || outlineFieldOf(cell)?.path.join('/') === 'style/outline');
    if (cells.length === 0) return null;
    const { graph } = cells[0];

    const colors = colored.map(colorOf);
    // Of each its own (a pipe: its default), or none (Auto)
    const outlines = outlined.map(cell => outlineOf(cell));
    const standIn = new dia.Cell({
        color: common(colors),
        finish: common(surfaced.map(finishOf)),
        outline: common(outlines),
        accent: common(accented.map(accentOf)),
        // Of different widths: none of them selected
        lineWidth: common(widened.map(cell => styleOf(cell, 'lineWidth') ?? 'normal')),
        outlineWidth: common(bordered.map(cell => styleOf(cell, 'outlineWidth') ?? 'auto')),
        // In different ones: none of them (see the input)
        layer: common(cells.map(cell => graph.getCellLayerId(cell))) ?? ''
    });
    const inputs: Record<string, unknown> = {};
    if (colored.length > 0) {
        inputs.color = {
            type: 'color',
            label: 'Color',
            // The default swatch: if they have the same default (the metal of the theme, ...)
            defaultValue: common(colored.map(defaultColorOf)),
            // Of different colors: none shown (see `renderColorField()`)
            mixed: common(colors) === undefined,
            // The colors of the diagram to pick (the stand-in is not in it)
            graph,
            group: 'appearance',
            index: 2
        };
    }
    if (surfaced.length > 0) {
        inputs.finish = {
            type: 'select-button-group',
            label: 'Finish',
            options: [
                { value: 'auto', content: 'Auto' },
                { value: 'shaded', content: 'Shaded' },
                { value: 'flat', content: 'Flat' }
            ],
            group: 'appearance',
            // First: it decides how their color is drawn
            index: 1
        };
    }
    if (outlined.length > 0) {
        inputs.outline = {
            type: 'color',
            label: 'Outline',
            // None of their own (as the shapes draw them), or mixed
            auto: true,
            mixed: common(outlines.map(outline => outline ?? AUTO)) === undefined,
            graph,
            group: 'appearance',
            index: 3
        };
    }
    standIn.on('change:color', (_cell: dia.Cell, color: string) => {
        changeAll(colored, cell => setField(cell, colorFieldOf(cell), color));
    });
    standIn.on('change:finish', (_cell: dia.Cell, finish: SurfaceFinish | 'auto') => {
        changeAll(surfaced, cell => (finish === 'auto' ? unsetStyle(cell, 'finish') : setStyle(cell, 'finish', finish)));
    });
    // A color, or none (Auto): removed
    if (accented.length > 0) {
        inputs.accent = {
            type: 'color',
            label: 'Accent',
            defaultValue: common(accented.map(cell => accentDefaultOf(cell))),
            mixed: common(accented.map(accentOf)) === undefined,
            graph,
            group: 'appearance',
            index: 4
        };
    }
    if (bordered.length > 0) {
        inputs.outlineWidth = {
            type: 'select-button-group',
            label: 'Outline width',
            help: 'outlineWidth',
            options: OUTLINE_WIDTH_OPTIONS,
            group: 'appearance',
            index: 3.5
        };
    }
    standIn.on('change:outlineWidth', (_cell: dia.Cell, width: string) => {
        if (width) changeAll(bordered, cell => (width === 'auto' ? unsetStyle(cell, 'outlineWidth') : setStyle(cell, 'outlineWidth', width)));
    });
    standIn.on('change:accent', (_cell: dia.Cell, accent: string) => {
        changeAll(accented, cell => setField(cell, accentFieldOf(cell), accent));
    });
    standIn.on('change:outline', (_cell: dia.Cell, outline: string | undefined) => {
        changeAll(outlined, cell => setOutline(cell, outline));
    });
    if (widened.length > 0) {
        // Of what (a selection has elements too): the size of the pipes, the thickness of the wires (of both too)
        const types = [...new Set(widened.map(cell => String(cell.get('type'))))];
        const { label, options } = lineWidthField(types);
        inputs.lineWidth = {
            type: 'select-button-group',
            label: types.length === 1 ? `${types[0] === 'Wire' ? 'Wire thickness' : 'Pipe size'}` : label,
            options,
            group: 'appearance',
            index: 5
        };
    }
    standIn.on('change:lineWidth', (_cell: dia.Cell, lineWidth: LineWidth) => {
        if (lineWidth) changeAll(widened, cell => setStyle(cell, 'lineWidth', lineWidth));
    });
    // Their layer: the one they are all in, or none (mixed); last, as of a single cell (see `inspector.ts`)
    inputs.layer = {
        type: 'select',
        label: 'Layer',
        options: [
            // In different ones: shown as such (not the first layer)
            ...(standIn.get('layer') === '' ? [{ value: '', content: 'Mixed' }] : []),
            ...Object.entries(LAYER_NAMES).map(([value, content]) => ({ value, content }))
        ],
        // ... not one to pick again
        attrs: { 'option[value=""]': { disabled: true, hidden: true }},
        group: 'appearance',
        index: 100
    };
    standIn.on('change:layer', (_cell: dia.Cell, layer: string) => {
        if (layer) changeAll(cells, cell => cell.set('layer', layer));
    });
    // A note under the heading (see `renderNoteField()`)
    if (note) inputs.note = { type: 'note', text: note, group: 'appearance', index: -1 };
    return new ui.Inspector({
        cell: standIn,
        inputs,
        groups: { appearance: { label, index: 1 }},
        // The help of the fields (the layer; the colors draw their own labels with it, see `color-field.ts`)
        renderLabel,
        // A note (see `renderNoteField()`), the colors (see `color-field.ts`)
        renderFieldContent: (options, ...rest) => renderNoteField(options) ?? renderColorField(options, ...rest),
        getFieldValue: attribute => (isColorField(attribute) ? getColorFieldValue(attribute) : undefined)
    });
}

/** The options of a note of the inspector: `type: 'note'`, its `text` */
interface NoteOptions {
    type?: string;
    text?: string;
}

/** A note of the inspector: a field without a value, a text of its own */
function renderNoteField(options: NoteOptions): HTMLElement | undefined {
    if (options.type !== 'note') return undefined;
    const el = document.createElement('p');
    el.className = 'scada-appearance-note';
    el.textContent = options.text ?? '';
    return el;
}
