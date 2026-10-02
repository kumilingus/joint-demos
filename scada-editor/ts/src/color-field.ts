import { type dia, type ui, util } from '@joint/plus';
import type { ColorField } from './shapes/Shape';

/*
 * The color fields of the inspector: the native color input (with its eyedropper), and the colors
 * to pick - as swatches next to it: the default of the field, the colors of the theme (CSS variables, a tone in
 * the light and one in the dark scheme: they can't be picked with the input), then the recent colors and the ones
 * of the diagram (the eyedropper picks a translucent color as drawn, not as it was set).
 * The fields of a list (the slices of a donut) are the native input only (their rows are narrow).
 */

/** The colors of the theme to pick (see `--color-*` in `shapes.css`) */
const THEME_COLORS: [string, string][] = [
    ['Blue', 'var(--color-blue)'],
    ['Green', 'var(--color-green)'],
    ['Violet', 'var(--color-violet)'],
    ['Slate', 'var(--color-slate)'],
    ['Amber', 'var(--color-amber)'],
    ['Red', 'var(--color-red)']
];

/** How many recent and diagram colors a field shows (a row next to the input), how many recent colors are kept */
const MAX_SWATCHES = 7;
const MAX_RECENT = 5;

/** The colors picked lately (in this session), the latest first */
const recentColors: string[] = [];

/** The color the user sets on the cell (a shape, a link of ours), if any: see `ColorField` */
export function colorFieldOf(cell: dia.Cell): ColorField | null {
    return (cell as dia.Cell & { colorField?: ColorField | null }).colorField ?? null;
}

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

/** The colors used in the diagram (set by the user: see `colorFieldOf()`, the slices of the donuts) */
function diagramColors(graph: dia.Graph): string[] {
    const colors = new Set<string>();
    graph.getCells().forEach((cell) => {
        const field = colorFieldOf(cell);
        const value = field && cell.prop(field.path);
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
/**
 * The options of a color field: `mixed` - the cells it is for (see `selection-inspector.ts`) have different
 * colors (none is shown); `graph` - the diagram of the colors to pick, for a cell not in it (a stand-in).
 */
interface ColorFieldOptions {
    type?: string;
    label?: string;
    defaultValue?: unknown;
    mixed?: boolean;
    graph?: dia.Graph;
}

export function renderColorField(options: ColorFieldOptions, path: string, value: unknown, inspector: ui.Inspector): HTMLElement | undefined {
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
    if (options.mixed) {
        // None of the colors (the inspector gives the field its default instead of no value)
        el.classList.add('mixed');
        input.title = 'Mixed: the colors differ';
    } else if (isHexColor(value) || isThemeColor(value)) {
        input.value = resolveColor(value);
    }
    // A color picked: the one of them all now
    const unmix = () => {
        el.classList.remove('mixed');
        input.removeAttribute('title');
    };
    input.addEventListener('change', unmix);
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
    // A color of the theme: set on the model (the input takes a hex only), shown as it is now
    const pickThemeColor = (color: string) => {
        cell.prop(path.split('/'), color);
        input.value = resolveColor(color);
        unmix();
    };
    const themeSwatch = (color: string, tooltip: string) => {
        const swatch = createSwatch(color, tooltip, () => pickThemeColor(color));
        swatch.classList.add('theme');
        return swatch;
    };
    // The default of the field (of the shape)
    const defaultColor = options.defaultValue ?? util.getByPath(util.result(cell, 'defaults') || {}, path, '/');
    if (isHexColor(defaultColor)) {
        swatches.append(createSwatch(defaultColor, `Default ${defaultColor}`, () => pick(defaultColor)));
    } else if (isThemeColor(defaultColor)) {
        swatches.append(themeSwatch(defaultColor, 'Default: the color of the theme (light / dark)'));
    }
    THEME_COLORS
        .filter(([, color]) => color !== defaultColor)
        .forEach(([name, color]) => swatches.append(themeSwatch(color, `${name} (light / dark)`)));
    // The recent colors and the ones of the diagram on a row of their own
    const others = document.createElement('span');
    others.className = 'color-swatches-break';
    swatches.append(others);
    const graph = cell.graph ?? options.graph;
    [...new Set([...recentColors, ...(graph ? diagramColors(graph) : [])])]
        .filter(color => color !== String(defaultColor).toLowerCase())
        .slice(0, MAX_SWATCHES)
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
