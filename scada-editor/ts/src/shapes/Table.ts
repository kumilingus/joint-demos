import type { dia } from '@joint/plus';
import { GRID_SIZE } from '../const';
import type { Overflow } from './footprint';
import { DERIVED } from './routing';
import Shape, { type ColorField, type Resizable } from './Shape';

/**
 * The heights of the parts of a table: its title (if it has a header), the names of the columns (if shown), a row -
 * on the grid (in its steps of resizing: a step of the bottom handle is a row)
 */
export const TITLE_HEIGHT = 40;
export const HEAD_HEIGHT = 20;
export const ROW_HEIGHT = 20;

// How narrow a column of an auto width can get; how wide a column of states is (unless set)
const MIN_COLUMN_WIDTH = 50;
const STATE_COLUMN_WIDTH = 32;

/** The value of a cell: a text, as shown (a number from the plant is formatted by it); of a state column `on`, `off` or `alarm` */
export type CellValue = string;

/** What a column shows: texts (from the left), numbers (to the right), states (a dot in the color of the state) */
export type ColumnKind = 'text' | 'number' | 'state';

/** A column of a table: its name, the kind of its values, its width (none, or 0: auto - a share of the rest) */
export interface Column {
    name: string;
    kind?: ColumnKind;
    width?: number;
}

/** The width of the column if it is not auto: its own, or of a column of states */
function fixedWidth({ kind, width }: Column): number | null {
    if (width && width > 0) return width;
    return kind === 'state' ? STATE_COLUMN_WIDTH : null;
}

/**
 * Where the columns of a table of the width start and how wide they are: the fixed ones as wide as they are,
 * the auto ones sharing the rest (with none, the last one takes it)
 */
export function columnLayout(columns: Column[], width: number): { starts: number[]; widths: number[] } {
    const fixed = columns.map(fixedWidth);
    const autos = fixed.filter(w => w === null).length;
    const rest = width - fixed.reduce<number>((sum, w) => sum + (w ?? 0), 0);
    const widths = fixed.map(w => w ?? rest / autos);
    if (autos === 0 && widths.length > 0) widths[widths.length - 1] += rest;
    const starts = widths.map((_, column) => widths.slice(0, column).reduce((sum, w) => sum + w, 0));
    return { starts, widths };
}

/** How narrow a table of the columns can get: the fixed ones, and some room for each auto one */
function minWidthOf(columns: Column[]): number {
    return columns.reduce((sum, column) => sum + (fixedWidth(column) ?? MIN_COLUMN_WIDTH), 0);
}

/**
 * A table: its columns (their names shown or not), the values of its rows (from the plant, see `simulation.ts`), a title
 * above them if it has a header - without both, a list (of states, of values). Resized, its height sets the number of its
 * rows (a row a step of the grid, as the length of a busbar its taps); its width is shared by the columns.
 * Drawn by its own view (see `TableView`): a change of a value updates that cell only.
 */
export default class Table extends Shape {

    // Not rotated: a table is read
    get rotatable(): boolean {
        return false;
    }

    // Not narrower than its columns, not lower than a row; by its sides and its bottom (the rows added below)
    get resizable(): Resizable {
        return { minWidth: minWidthOf(this.columns), minHeight: Table.heightOf(this, 1), directions: ['left', 'right', 'bottom'] };
    }

    // No label below it
    get overflow(): Overflow {
        return { bottom: 0 };
    }

    get tagPrefix(): string {
        return 'TB';
    }

    // Its color: the fill; its outline: the border and the grid; its accent: the head with the names of the columns
    // (the defaults in its `defaults()`)
    get colorField(): ColorField {
        return { path: ['fill'] };
    }

    get outlineField(): ColorField {
        return { path: ['stroke'] };
    }

    get accentField(): ColorField {
        return { path: ['headerFill'] };
    }

    get columns(): Column[] {
        return this.get('columns') ?? [];
    }

    get values(): CellValue[][] {
        return this.get('values') ?? [];
    }

    /** The height of the title and the names of the columns of the table (those it shows) */
    static headOf(table: dia.Element): number {
        return (table.get('header') ? TITLE_HEIGHT : 0) + (table.get('names') ? HEAD_HEIGHT : 0);
    }

    /** The height of the table with its rows (or as many) */
    static heightOf(table: dia.Element, rows: number = table.get('rows') ?? 0): number {
        return Table.headOf(table) + rows * ROW_HEIGHT;
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Table',
            size: {
                width: 240,
                height: TITLE_HEIGHT + HEAD_HEIGHT + 3 * ROW_HEIGHT
            },
            header: true,
            title: 'Table',
            names: true,
            columns: [{ name: 'Name', kind: 'text' }, { name: 'Value', kind: 'number' }],
            rows: 3,
            values: [['Pump 1', '12.4'], ['Pump 2', '8.1'], ['Pump 3', '0.0']],
            // Its colors (see `TableView`)
            fill: 'var(--shape-face)',
            stroke: 'var(--shape-table-line)',
            headerFill: 'var(--shape-table-header)'
        };
    }

    preinitialize(): void {
        this.markup = [];
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        // The values and the height follow the columns, the rows (set, not taken by a resize) and the header
        // (derived: an undo of them follows too)
        this.on('change:columns change:rows change:header change:names', (_table: dia.Element, _value: unknown, options: dia.Cell.Options) => this.fit(!options.resized));
        // Resized: as many rows as the height takes (derived: an undo of the resize takes them back)
        this.on('change:size', (_table: dia.Element, _size: dia.Size, options: dia.Cell.Options) => this.fitRows(options));
        this.fit(true);
    }

    /**
     * As many rows as the height takes (one at least), the height snapped to them: a resize by the handles is in
     * the steps of the grid (a row each) already, any other one (set, loaded) is fitted
     */
    protected fitRows(options: dia.Cell.Options): void {
        if (options.derived) return;
        const rows = Math.max(1, Math.round((this.size().height - Table.headOf(this)) / ROW_HEIGHT));
        if (rows !== this.get('rows')) this.set('rows', rows, { ...DERIVED, resized: true });
        this.fit(true);
    }

    /**
     * The values as many as the rows and the columns (cut, or the new cells empty); the height of the rows (if set),
     * the width not narrower than the columns take (on the grid)
     */
    protected fit(height: boolean): void {
        const { columns, values } = this;
        const rows: number = this.get('rows') ?? 0;
        const fitted = Array.from({ length: rows }, (_, row) => Array.from({ length: columns.length }, (_, column) => values[row]?.[column] ?? ''));
        if (JSON.stringify(fitted) !== JSON.stringify(values)) this.set('values', fitted, DERIVED);
        const size = this.size();
        const minWidth = Math.ceil(minWidthOf(columns) / (2 * GRID_SIZE)) * 2 * GRID_SIZE;
        const fittedWidth = Math.max(size.width, minWidth);
        const fittedHeight = height ? Table.heightOf(this) : size.height;
        if (size.height !== fittedHeight || size.width !== fittedWidth) this.resize(fittedWidth, fittedHeight, DERIVED);
    }
}
