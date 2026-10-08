import type { dia } from '@joint/plus';
import { styleOf } from './style';
import Connection from '../models/Connection';

/*
 * The width of a link (a pipe, a wire): thin, normal or thick - its strokes scaled together (the line, the dashes of
 * the flow: `strokeWidthBase` on them) when it is drawn, set in the inspector. The outline of a pipe is around its
 * line (see `Pipe`). A pipe stays within its
 * pipe stubs (see `ports.ts`).
 */

export type LineWidth = 'thin' | 'normal' | 'thick';

/** The widths to pick: how much the strokes are scaled */
export const LINE_WIDTHS: Record<LineWidth, { scale: number }> = {
    thin: { scale: 0.6 },
    normal: { scale: 1 },
    thick: { scale: 1.5 }
};

/**
 * The field of the width, as the user calls it: the size of a pipe (small, medium, large), the thickness of a wire
 * (thin, normal, thick) - of several kinds of the links, their thickness
 */
export function lineWidthField(types: string[]): { label: string; options: Array<{ value: LineWidth; content: string }> } {
    const pipes = types.length > 0 && types.every(type => type === 'Pipe');
    const names: Record<LineWidth, string> = pipes
        ? { thin: 'Small', normal: 'Medium', thick: 'Large' }
        : { thin: 'Thin', normal: 'Normal', thick: 'Thick' };
    return {
        label: pipes ? 'Size' : 'Thickness',
        options: (Object.keys(names) as LineWidth[]).map(value => ({ value, content: names[value] }))
    };
}

/** The widths of the strokes of a link (normal), by their selectors */
export type StrokeWidths = Record<string, number>;

/** A width of a stroke (normal) at the size of the link (its `lineWidth`, see `style.ts`), to half a pixel */
export function scaledWidth(cell: dia.Cell, strokeWidth: number): number {
    const { scale } = LINE_WIDTHS[styleOf<LineWidth>(cell, 'lineWidth') ?? 'normal'] ?? LINE_WIDTHS.normal;
    return Math.round(strokeWidth * scale * 2) / 2;
}

export const lineWidthAttributes = {
    // `strokeWidthBase` in the attributes: the width of the stroke at the normal size, scaled by the size of the link
    'stroke-width-base': {
        set(this: dia.CellView, strokeWidth: number) {
            return { 'stroke-width': scaledWidth(this.model, Number(strokeWidth) || 0) };
        }
    }
};

/** Whether the user chooses the width of the link (see `lineWidthAttributes`) */
export function hasLineWidth(cell: dia.Cell): boolean {
    return Connection.isConnection(cell) && cell.strokeWidths !== null;
}
