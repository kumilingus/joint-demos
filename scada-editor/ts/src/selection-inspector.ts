import { dia, ui, util } from '@joint/plus';
import { colorFieldOf, getColorFieldValue, renderColorField } from './color-field';
import { hasShading, type SurfaceFinish } from './shapes/gradients';
import { isGroup } from './shapes/Group';

/*
 * The appearance of several cells at once (a selection of them, the members of a group): an inspector
 * of a cell standing in for them all, with the fields they share - the color (of each its own: the metal
 * of a pump, the line of a pipe, the text of a label, see `ColorField`) and the finish (of those with shaded surfaces).
 * A field shows the value they all have, or none ("mixed") if they differ; a change sets it on all of them,
 * one step of the history.
 */

/**
 * The cells whose appearance the cells stand for: a group for its elements (in the groups in it too;
 * not its pipes: their color is their medium), any other cell for itself.
 */
export function appearanceTargets(cells: dia.Cell[]): dia.Cell[] {
    const targets = cells.flatMap(cell => (isGroup(cell)
        ? cell.getEmbeddedCells({ deep: true }).filter(member => member.isElement() && !isGroup(member))
        : [cell]));
    return [...new Set(targets)];
}

/** The default color of the cell (of its shape) */
function defaultColorOf(cell: dia.Cell): unknown {
    const { path, defaultValue } = colorFieldOf(cell)!;
    return util.getByPath(util.result(cell, 'defaults') || {}, path.join('/'), '/') ?? defaultValue;
}

/** The color of the cell as drawn: its own, or the default of its shape */
const colorOf = (cell: dia.Cell): unknown => cell.prop(colorFieldOf(cell)!.path) ?? defaultColorOf(cell);

const finishOf = (cell: dia.Cell): SurfaceFinish => cell.get('finish') ?? 'shaded';

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
export function createAppearanceInspector(cells: dia.Cell[], label: string): ui.Inspector | null {
    const colored = cells.filter(cell => colorFieldOf(cell));
    const surfaced = cells.filter(cell => cell.isElement() && hasShading(cell));
    if (colored.length === 0 && surfaced.length === 0) return null;
    const graph = (colored[0] ?? surfaced[0]).graph;

    const colors = colored.map(colorOf);
    const standIn = new dia.Cell({
        color: common(colors),
        finish: common(surfaced.map(finishOf))
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
            index: 1
        };
    }
    if (surfaced.length > 0) {
        inputs.finish = {
            type: 'select-button-group',
            label: 'Finish',
            options: [
                { value: 'shaded', content: 'Shaded' },
                { value: 'flat', content: 'Flat' }
            ],
            group: 'appearance',
            index: 2
        };
    }
    standIn.on('change:color', (_cell: dia.Cell, color: string) => {
        changeAll(colored, cell => cell.prop(colorFieldOf(cell)!.path, color));
    });
    standIn.on('change:finish', (_cell: dia.Cell, finish: SurfaceFinish) => {
        changeAll(surfaced, cell => cell.set('finish', finish));
    });
    return new ui.Inspector({
        cell: standIn,
        inputs,
        groups: { appearance: { label, index: 1 }},
        renderFieldContent: renderColorField,
        getFieldValue: getColorFieldValue
    });
}
