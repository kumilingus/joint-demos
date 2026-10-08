import { dia, util } from '@joint/plus';
import { LABEL_COLOR } from '../../const';
import { colorFieldOf, outlineFieldOf, accentFieldOf, fieldDefault } from '../../inspector/color-field';
import type Table from '../models/charts/Table';
import { markTag } from '../common/tag';
import { columnLayout, HEAD_HEIGHT, ROW_HEIGHT, TITLE_HEIGHT, type CellValue } from '../models/charts/Table';

/*
 * The view of a table (see `Table`), as the counters demo draws its nodes: the structure (the grid, the title,
 * the names of the columns) is rendered when it changes (the columns, the rows, the header, the names, the size), a change
 * of the values updates the cells that changed only (a text, the color of a state), a change of the colors their attributes.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

// The space between the text of a cell and its sides
const CELL_PADDING = 8;
const FONT = { 'font-family': 'sans-serif', 'font-size': 13 };

// A state: a dot in its color (an unknown one: an empty circle)
const STATE_RADIUS = 6;
const STATE_COLORS: Record<string, string> = {
    on: 'var(--color-green)',
    off: 'var(--shape-table-line)',
    alarm: 'var(--color-red)'
};

/** The papers showing the values of the tables (the runtime mode): elsewhere they are the plant's to send - placeholders */
const livePapers = new WeakSet<dia.Paper>();

/** Show the values of the tables of the paper (the runtime mode), or placeholders (the edit mode, the palette) */
export function setTablesLive(paper: dia.Paper, live: boolean): void {
    if (live) {
        livePapers.add(paper);
    } else {
        livePapers.delete(paper);
    }
    paper.model.getElements().forEach((element) => {
        const view = element.findView(paper);
        if (view instanceof TableView) view.updateValues(true);
    });
}

const Flags = {
    ...dia.ElementView.Flags,
    TABLE: 'TABLE',
    VALUES: 'VALUES',
    COLORS: 'COLORS',
    TAG: 'TAG'
};

/** A new SVG element with the attributes, in the parent */
function svg<K extends keyof SVGElementTagNameMap>(
    parent: Element,
    tag: K,
    attributes: Record<string, string | number>
): SVGElementTagNameMap[K] {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => el.setAttribute(name, String(value)));
    parent.append(el);
    return el;
}

/** The color of the field of the table: its own, or the default (see `ColorField`) */
function colorOf(table: dia.Element, field: ReturnType<typeof colorFieldOf>): string {
    if (!field) return 'none';
    return table.prop(field.path) ?? fieldDefault(table, field) ?? 'none';
}

export default class TableView extends dia.ElementView {

    declare model: Table;

    /** The group the table is drawn in (the highlighters of the view stay beside it) */
    protected content: SVGGElement | null = null;
    /** The parts colored by the fields of the table */
    protected body: SVGRectElement | null = null;
    protected border: SVGRectElement | null = null;
    protected grid: SVGPathElement | null = null;
    protected head: SVGRectElement | null = null;
    /** The texts of the cells by the row and the column, and the values they show */
    protected cells: Array<Array<SVGTextElement | SVGCircleElement>> = [];
    protected shown: CellValue[][] = [];

    presentationAttributes(): dia.CellView.PresentationAttributes {
        return dia.ElementView.addPresentationAttributes({
            columns: [Flags.TABLE],
            rows: [Flags.TABLE],
            header: [Flags.TABLE],
            names: [Flags.TABLE],
            title: [Flags.TABLE],
            // Its values (see `data.ts`): the cells that changed
            data: [Flags.VALUES],
            // Its colors (see `style.ts`)
            style: [Flags.COLORS],
            // Its ID on the view (see `markTag()`)
            tag: [Flags.TAG]
        });
    }

    confirmUpdate(flag: number, options: { [key: string]: unknown }): number {
        let flags = super.confirmUpdate(flag, options);
        if (this.hasFlag(flags, Flags.TABLE)) {
            this.update();
            flags = this.removeFlag(flags, [Flags.TABLE, Flags.VALUES, Flags.COLORS]);
        }
        if (this.hasFlag(flags, Flags.VALUES)) {
            this.updateValues();
            flags = this.removeFlag(flags, Flags.VALUES);
        }
        if (this.hasFlag(flags, Flags.COLORS)) {
            this.updateColors();
            flags = this.removeFlag(flags, Flags.COLORS);
        }
        if (this.hasFlag(flags, Flags.TAG)) {
            markTag(this);
            flags = this.removeFlag(flags, Flags.TAG);
        }
        return flags;
    }

    render(): this {
        this.el.replaceChildren();
        // A markup of the group it is drawn in: the selectors of the view (`root` - the frames of the selection, the
        // highlighters of the log find it)
        this.renderJSONMarkup([{ tagName: 'g', selector: 'content' }]);
        const content = this.findNode('content');
        this.content = content instanceof SVGGElement ? content : null;
        this.update();
        this.updateTransformation();
        markTag(this);
        return this;
    }

    /** The whole table drawn again (rendered, resized): the structure, its values and colors */
    update(): void {
        const { content: el, model } = this;
        if (!el) return;
        el.replaceChildren();
        const { width, height } = model.size();
        const { columns } = model;
        const rows: number = model.get('rows') ?? 0;
        const header = Boolean(model.get('header'));
        const names = Boolean(model.get('names'));
        const top = header ? TITLE_HEIGHT : 0;
        const bodyTop = top + (names ? HEAD_HEIGHT : 0);
        const rowHeight = ROW_HEIGHT;
        // Where each column starts, how wide it is (see `columnLayout()`)
        const { starts, widths } = columnLayout(columns, width);

        this.body = svg(el, 'rect', { width, height, rx: 4, ry: 4 });
        this.head = names ? svg(el, 'rect', { y: top, width, height: HEAD_HEIGHT }) : null;
        // The lines under the title and the names, between the rows, between the columns
        const rowLines = Array.from({ length: Math.max(rows - 1, 0) }, (_, row) => bodyTop + (row + 1) * rowHeight);
        const ys = new Set([...(header ? [top] : []), ...(names ? [bodyTop] : []), ...rowLines]);
        const lines = [
            ...[...ys].filter(y => y > 0 && y < height).map(y => `M 0 ${y} H ${width}`),
            ...starts.slice(1).map(x => `M ${x} ${top} V ${height}`)
        ];
        this.grid = svg(el, 'path', { d: lines.join(' '), fill: 'none' });
        // The border over the head and the grid
        this.border = svg(el, 'rect', { width, height, rx: 4, ry: 4, fill: 'none', 'stroke-width': 1.5 });

        if (header) {
            this.text(el, String(model.get('title') ?? ''), width / 2, TITLE_HEIGHT / 2, width - 2 * CELL_PADDING, 'middle', { 'font-weight': 'bold', 'font-size': 15 });
        }
        if (names) {
            columns.forEach(({ name }, column) => {
                this.text(el, name ?? '', starts[column] + widths[column] / 2, top + HEAD_HEIGHT / 2, widths[column] - 2 * CELL_PADDING, 'middle', { 'font-weight': 'bold' });
            });
        }
        // The cells by the kind of their column: a text from the left, a number to the right, a state a dot in the middle
        this.cells = Array.from({ length: rows }, (_, row) => columns.map(({ kind = 'text' }, column) => {
            const y = bodyTop + (row + 0.5) * rowHeight;
            if (kind === 'state') {
                return svg(el, 'circle', { cx: starts[column] + widths[column] / 2, cy: y, r: STATE_RADIUS, 'stroke-width': 1, 'pointer-events': 'none' });
            }
            const x = kind === 'number' ? starts[column] + widths[column] - CELL_PADDING : starts[column] + CELL_PADDING;
            return svg(el, 'text', {
                ...FONT,
                x,
                y,
                dy: '0.35em',
                'text-anchor': kind === 'number' ? 'end' : 'start',
                fill: LABEL_COLOR,
                'pointer-events': 'none'
            });
        }));
        this.shown = [];
        this.updateValues();
        this.updateColors();
    }

    /**
     * The cells whose values changed (all of them again if `all`): the text of a text, the color of a state -
     * placeholders unless the paper is live (see `setTablesLive()`)
     */
    updateValues(all = false): void {
        const { values } = this.model;
        const live = Boolean(this.paper && livePapers.has(this.paper));
        if (all) this.shown = [];
        this.cells.forEach((row, rowIndex) => row.forEach((cell, column) => {
            const value = live ? values[rowIndex]?.[column] ?? '' : '';
            if (this.shown[rowIndex]?.[column] === value) return;
            (this.shown[rowIndex] ??= [])[column] = value;
            if (cell instanceof SVGCircleElement) {
                cell.setAttribute('fill', STATE_COLORS[value] ?? 'none');
                cell.setAttribute('stroke', STATE_COLORS[value] ? 'none' : 'var(--shape-table-line)');
            } else {
                cell.textContent = value || '–';
            }
        }));
    }

    /** The colors of the table: its fill, its lines, its head */
    updateColors(): void {
        const { model } = this;
        const stroke = colorOf(model, outlineFieldOf(model));
        this.body?.setAttribute('fill', colorOf(model, colorFieldOf(model)));
        this.head?.setAttribute('fill', colorOf(model, accentFieldOf(model)));
        this.grid?.setAttribute('stroke', stroke);
        this.border?.setAttribute('stroke', stroke);
    }

    /** A text centered on a line at the point, cut with an ellipsis to the width */
    protected text(
        parent: Element,
        text: string,
        x: number,
        y: number,
        width: number,
        anchor: string,
        attributes: Record<string, string | number> = {}
    ): void {
        const fontAttributes = { ...FONT, ...attributes };
        const fitted = this.paper
            ? util.breakText(text, { width }, fontAttributes, { svgDocument: this.paper.svg, ellipsis: true, maxLineCount: 1 })
            : text;
        const el = svg(parent, 'text', { ...fontAttributes, x, y, dy: '0.35em', 'text-anchor': anchor, fill: LABEL_COLOR, 'pointer-events': 'none' });
        el.textContent = fitted;
    }
}
