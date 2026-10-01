import { type dia, type ui, util } from '@joint/plus';

/*
 * The color fields of the inspector: the native color input (with its eyedropper), and the colors
 * to pick again - the recent ones and the ones of the diagram - as swatches under it (the eyedropper picks
 * a translucent color as drawn, not as it was set). The first swatch is the default of the field: a color
 * of the theme (a CSS variable, different in the light and the dark scheme) can't be picked otherwise.
 * The fields of a list (the slices of a donut) are the native input only (their rows are narrow).
 */

/** How many swatches a field shows (one row next to the input), how many recent colors are kept */
const MAX_SWATCHES = 7;
const MAX_RECENT = 5;

/** The colors picked lately (in this session), the latest first */
const recentColors: string[] = [];

/** The colors the user sets (the color fields of the inspector, see `inspector.ts`): the paths by the types */
const COLOR_PATHS: Record<string, string[]> = {
    Rectangle: ['attrs', 'body', 'fill'],
    Ellipse: ['attrs', 'body', 'fill'],
    Pipe: ['attrs', 'line', 'stroke'],
    Wire: ['attrs', 'line', 'stroke'],
    SignalLine: ['attrs', 'line', 'stroke'],
    Label: ['attrs', 'label', 'fill']
};

const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

/** A color of the theme: a CSS variable (see `shapes.css`) */
const isThemeColor = (value: unknown): value is string => typeof value === 'string' && value.startsWith('var(');

/** The color as drawn now (a CSS variable resolved in the current scheme), as a hex (for the native input) */
function resolveColor(value: string): string {
    if (isHexColor(value)) return value;
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.append(probe);
    const rgb = getComputedStyle(probe).color.match(/\d+/g) || [];
    probe.remove();
    return '#' + rgb.slice(0, 3).map(channel => Number(channel).toString(16).padStart(2, '0')).join('');
}

/** A swatch of a color */
function createSwatch(color: string, tooltip: string, onClick: () => void): HTMLButtonElement {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-swatch';
    swatch.style.background = color;
    swatch.dataset.tooltip = tooltip;
    swatch.addEventListener('click', onClick);
    return swatch;
}

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
    if (isHexColor(value) || isThemeColor(value)) input.value = resolveColor(value);
    // The input and the swatches on a row
    const row = document.createElement('div');
    row.className = 'color-field-row';
    row.append(input);
    el.append(row);

    const cell = inspector.options.cell as dia.Cell;
    // As a picked color: the inspector saves it (one step of the history)
    const pick = (color: string) => {
        input.value = color;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const swatches = document.createElement('div');
    swatches.className = 'color-swatches';
    // The default of the field (of the shape): a color of the theme is set on the model (the input takes a hex only)
    const defaultColor = util.getByPath(util.result(cell, 'defaults') || {}, path, '/');
    if (isHexColor(defaultColor)) {
        swatches.append(createSwatch(defaultColor, `Default ${defaultColor}`, () => pick(defaultColor)));
    } else if (isThemeColor(defaultColor)) {
        const swatch = createSwatch(defaultColor, 'Default: the color of the theme (light / dark)', () => {
            cell.prop(path.split('/'), defaultColor);
            input.value = resolveColor(defaultColor);
        });
        swatch.classList.add('theme');
        swatches.append(swatch);
    }
    const graph = cell.graph;
    [...new Set([...recentColors, ...(graph ? diagramColors(graph) : [])])]
        .filter(color => color !== String(defaultColor).toLowerCase())
        .slice(0, MAX_SWATCHES - swatches.childElementCount)
        .forEach(color => swatches.append(createSwatch(color, color, () => pick(color))));
    if (swatches.childElementCount > 0) row.append(swatches);
    return el;
}

/** The value of a color field (the `getFieldValue` of the inspector): of its native input */
export function getColorFieldValue(attribute: HTMLElement): { value: string } | undefined {
    if (!attribute.classList.contains('color-field-content')) return undefined;
    const input = attribute.querySelector<HTMLInputElement>('input[type="color"]');
    return input ? { value: input.value } : undefined;
}
