import type { dia } from '@joint/plus';
import { DERIVED } from './routing';

/*
 * The width of a link (a pipe, a wire): thin, normal or thick - its strokes scaled together (the line, the dashes of
 * the flow), set in the inspector. The outline of a pipe is around its line (see `Pipe`). A pipe stays within its
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

/** The attributes of the strokes at the width (to half a pixel) */
export function lineWidthAttrs(strokeWidths: StrokeWidths, width: LineWidth): dia.Cell.Selectors {
    const { scale } = LINE_WIDTHS[width] ?? LINE_WIDTHS.normal;
    return Object.fromEntries(Object.entries(strokeWidths)
        .map(([selector, strokeWidth]) => [selector, { strokeWidth: Math.round(strokeWidth * scale * 2) / 2 }]));
}

/** The strokes of the link follow its width (`lineWidth`: derived changes, not in the history). */
export function followLineWidth(link: dia.Link, strokeWidths: StrokeWidths): void {
    link.on('change:lineWidth', (_link: dia.Link, width: LineWidth, options: dia.Cell.Options) => {
        // Unset (undone to none): the strokes set back to normal, not unset with it
        const { unset: _unset, ...setOptions } = options;
        link.attr(lineWidthAttrs(strokeWidths, width), { ...setOptions, ...DERIVED });
    });
}

/** Whether the user chooses the width of the link (see `followLineWidth()`) */
export function hasLineWidth(cell: dia.Cell): boolean {
    return (cell as dia.Cell & { strokeWidths?: StrokeWidths }).strokeWidths !== undefined;
}
