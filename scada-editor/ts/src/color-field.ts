import type { dia, ui } from '@joint/plus';

/*
 * The color fields of the inspector: the native color input (with its eyedropper), and the colors
 * to pick again - the recent ones and the ones of the diagram - as swatches under it (the eyedropper picks
 * a translucent color as drawn, not as it was set). The fields of a list (the slices of a donut) are
 * the native input only (their rows are narrow).
 */

/** How many swatches a field shows, how many recent colors are kept */
const MAX_SWATCHES = 8;
const MAX_RECENT = 5;

/** The colors picked lately (in this session), the latest first */
const recentColors: string[] = [];

/** The colors the user sets (the color fields of the inspector, see `inspector.ts`): the paths by the types */
const COLOR_PATHS: Record<string, string[]> = {
    Rectangle: ['attrs', 'body', 'fill'],
    Ellipse: ['attrs', 'body', 'fill'],
    Pipe: ['attrs', 'line', 'stroke'],
    Label: ['attrs', 'label', 'fill']
};

const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

/** The colors used in the diagram (set by the user: see `COLOR_PATHS`, the slices of the donuts) */
function diagramColors(graph: dia.Graph): string[] {
    const colors = new Set<string>();
    graph.getCells().forEach((cell) => {
        const path = COLOR_PATHS[cell.get('type')];
        const value = path && cell.prop(path);
        if (isHexColor(value)) colors.add(value.toLowerCase());
        const slices = cell.get('slices');
        if (Array.isArray(slices)) slices.forEach(slice => isHexColor(slice?.color) && colors.add(slice.color.toLowerCase()));
    });
    return [...colors];
}

/** Remember a picked color (the latest first) */
export function rememberColor(color: string): void {
    if (!isHexColor(color)) return;
    const value = color.toLowerCase();
    const index = recentColors.indexOf(value);
    if (index !== -1) recentColors.splice(index, 1);
    recentColors.unshift(value);
    recentColors.length = Math.min(recentColors.length, MAX_RECENT);
}

/**
 * The content of a color field (the `renderFieldContent` of the inspector): the native input, saved
 * by the inspector as its own (it has the attribute and the type), and the swatches setting it.
 * `undefined` for the other fields and the colors of a list (the default content).
 */
export function renderColorField(options: { type?: string; label?: string }, path: string, value: unknown, inspector: ui.Inspector): HTMLElement | undefined {
    if (options.type !== 'color' || /\/\d+\//.test(path)) return undefined;
    const el = document.createElement('div');
    el.className = 'color-field-content';
    // The content of a field includes its label.
    const label = document.createElement('label');
    label.textContent = options.label ?? path;
    el.append(label);
    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'color';
    input.dataset.attribute = path;
    input.dataset.type = 'color';
    if (isHexColor(value)) input.value = value;
    // The input and the swatches on a row
    const row = document.createElement('div');
    row.className = 'color-field-row';
    row.append(input);
    el.append(row);

    const graph = (inspector.options.cell as dia.Cell).graph;
    const colors = [...new Set([...recentColors, ...(graph ? diagramColors(graph) : [])])].slice(0, MAX_SWATCHES);
    if (colors.length > 0) {
        const swatches = document.createElement('div');
        swatches.className = 'color-swatches';
        colors.forEach((color) => {
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'color-swatch';
            swatch.style.background = color;
            swatch.dataset.tooltip = color;
            swatch.addEventListener('click', () => {
                input.value = color;
                // As a picked color: the inspector saves it (one step of the history)
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
            swatches.append(swatch);
        });
        row.append(swatches);
    }
    return el;
}

/** The value of a color field (the `getFieldValue` of the inspector): of its native input */
export function getColorFieldValue(attribute: HTMLElement): { value: string } | undefined {
    if (!attribute.classList.contains('color-field-content')) return undefined;
    const input = attribute.querySelector<HTMLInputElement>('input[type="color"]');
    return input ? { value: input.value } : undefined;
}
