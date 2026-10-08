import { type dia, type ui, util } from '@joint/plus';
import type { ColorField } from '../shapes/models/Shape';
import { featuresOf } from '../shapes/common/features';
import { renderLabel } from './help';
import { dataOf } from '../shapes/common/data';
import { setBesidePanel } from '../tooltips';
import { getCellDefaults } from '../shapes/defaults';

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

/** The colors of the canvas to pick (see `--canvas-*` in `shapes.css`): light in the light scheme, dark in the dark one */
export const CANVAS_COLORS: [string, string][] = [
    ['White / Black', 'var(--canvas-white)'],
    ['Blue', 'var(--canvas-blue)'],
    ['Green', 'var(--canvas-green)'],
    ['Violet', 'var(--canvas-violet)'],
    ['Gray (ISA-101)', 'var(--canvas-gray)'],
    ['Sand', 'var(--canvas-sand)']
];

/** The color of the canvas: light in the light scheme, dark in the dark one - flat, a line drawing */
const CANVAS_SWATCH: [string, string] = ['Canvas', 'var(--shape-canvas)'];

/** How many recent and diagram colors a field shows (a row next to the input), how many recent colors are kept */
const MAX_SWATCHES = 7;
const MAX_RECENT = 5;

/** The colors picked lately (in this session), the latest first */
const recentColors: string[] = [];

/** The color the user sets on the cell (a shape, a link of ours), if any: see `ColorField` */
export function colorFieldOf(cell: dia.Cell): ColorField | null {
    return featuresOf(cell)?.colorField ?? null;
}

/** The color of the outline the user sets on the cell, if any (see `ColorField`) */
export function outlineFieldOf(cell: dia.Cell): ColorField | null {
    return featuresOf(cell)?.outlineField ?? null;
}

/** The color of the accent the user sets on the cell, if any (see `ColorField`) */
export function accentFieldOf(cell: dia.Cell): ColorField | null {
    return featuresOf(cell)?.accentField ?? null;
}

/** The default of the color field of the cell: its own, or of the defaults of its shape; none - Auto */
export function fieldDefault(cell: dia.Cell, field: ColorField): string | undefined {
    const defaults = getCellDefaults(cell);
    // The color of its part (its own in the defaults of the shape), or of the default of the style
    if (field.part) return field.defaultValue ?? util.getByPath(defaults, ['attrs', ...field.part].join('/'), '/');
    return field.defaultValue ?? util.getByPath(defaults, field.path.join('/'), '/');
}

const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

/** A color of the theme: a CSS variable (see `shapes.css`) */
const isThemeColor = (value: unknown): value is string => typeof value === 'string' && value.startsWith('var(');

/** A canvas of a pixel: a color painted on it is read back in sRGB (see `resolveColor()`) */
let pixel: CanvasRenderingContext2D | null = null;

/**
 * The color as drawn now (a CSS variable resolved in the current scheme), as a hex (for the native input).
 * The computed color may be in another color space (`color-mix()` in oklab): it is painted and read back in sRGB.
 */
function resolveColor(value: string): string {
    if (isHexColor(value)) return value;
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.append(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    pixel ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!pixel) return '#000000';
    pixel.clearRect(0, 0, 1, 1);
    pixel.fillStyle = computed;
    pixel.fillRect(0, 0, 1, 1);
    const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
    return '#' + [r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('');
}

/** A swatch of a color */
function createSwatch(color: string, tooltip: string, onClick: () => void): HTMLButtonElement {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'scada-color-swatch';
    swatch.style.background = color;
    swatch.dataset.tooltip = tooltip;
    setBesidePanel(swatch, 'inspector');
    swatch.addEventListener('click', onClick);
    return swatch;
}

/** The colors used in the diagram (set by the user: the colors, the outlines, the accents of the cells, the slices of the donuts) */
function diagramColors(graph: dia.Graph): string[] {
    const colors = new Set<string>();
    graph.getCells().forEach((cell) => {
        [colorFieldOf(cell), outlineFieldOf(cell), accentFieldOf(cell)].forEach((field) => {
            const value = field && cell.prop(field.path);
            if (isHexColor(value)) colors.add(value.toLowerCase());
        });
        const slices = dataOf(cell, 'slices');
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
 * The options of a color field: `mixed` - the cells it is for (see `selection-inspector.ts`) have different
 * colors (none is shown); `graph` - the diagram of the colors to pick, for a cell not in it (a stand-in);
 * `auto` - the color can be none of the cell's own (an Auto swatch removes it, e.g. the outline of a shape);
 * `themeOnly` - the colors of the theme only (no picker, no colors of the diagram: a text readable in both schemes);
 * `palette` - the colors of the theme to pick (instead of `THEME_COLORS`, e.g. the canvases).
 */
interface ColorFieldOptions {
    type?: string;
    label?: string;
    defaultValue?: unknown;
    mixed?: boolean;
    graph?: dia.Graph;
    auto?: boolean;
    themeOnly?: boolean;
    palette?: [string, string][];
}

/**
 * The content of a color field (the `renderFieldContent` of the inspector): the native input, saved
 * by the inspector as its own (it has the attribute and the type), and the swatches setting it.
 * `undefined` for the other fields and the colors of a list (the default content).
 */
export function renderColorField(
    options: ColorFieldOptions,
    path: string,
    value: unknown,
    inspector: ui.Inspector
): HTMLElement | undefined {
    if (options.type !== 'color' || /\/\d+\//.test(path)) return undefined;
    const el = document.createElement('div');
    el.className = 'scada-color-field-content';
    // The content of a field includes its label (with the help of the field, if it has one).
    // The help of the field by its path, or of its kind by its label (a color is at a path of each shape's own)
    const label = renderLabel(options, path) ?? renderLabel(options, (options.label ?? '').toLowerCase()) ?? document.createElement('label');
    if (!label.textContent) label.textContent = options.label ?? path;
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
    } else if (options.auto) {
        el.classList.add('auto');
    }
    // A color picked: the one of them all now (not mixed, not auto)
    const unmix = () => {
        el.classList.remove('mixed', 'auto');
        input.removeAttribute('title');
    };
    input.addEventListener('change', unmix);
    // The input and the swatches on a row
    const row = document.createElement('div');
    row.className = 'scada-color-field-row';
    if (options.themeOnly) el.classList.add('scada-theme-only');
    row.append(input);
    el.append(row);

    const cell = inspector.options.cell as dia.Cell;
    // As a picked color: the inspector saves it (one step of the history)
    const pick = (color: string) => {
        input.value = color;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const swatches = document.createElement('div');
    swatches.className = 'scada-color-swatches';
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
    // None of its own: the shape's (an outline as the shape draws it)
    if (options.auto) {
        const swatch = createSwatch('transparent', 'Auto: as the shape draws it', () => {
            // The path as a string: `removeProp()` doesn't unset a top-level property given as an array
            cell.removeProp(path);
            unmix();
            el.classList.add('auto');
        });
        swatch.classList.add('auto');
        swatches.append(swatch);
    }
    // The default of the field (of the shape)
    const defaultColor = options.defaultValue ?? util.getByPath(getCellDefaults(cell), path, '/');
    if (isHexColor(defaultColor)) {
        swatches.append(createSwatch(defaultColor, `Default ${defaultColor}`, () => pick(defaultColor)));
    } else if (isThemeColor(defaultColor)) {
        swatches.append(themeSwatch(defaultColor, 'Default: the color of the theme (light / dark)'));
    }
    (options.palette ?? THEME_COLORS)
        .filter(([, color]) => color !== defaultColor)
        .forEach(([name, color]) => swatches.append(themeSwatch(color, `${name} (light / dark)`)));
    // On a row of their own: the canvas, the recent colors and the ones of the diagram
    const others = document.createElement('span');
    others.className = 'scada-color-swatches-break';
    swatches.append(others);
    if (options.themeOnly) {
        row.append(swatches);
        return el;
    }
    const [canvasName, canvasColor] = CANVAS_SWATCH;
    // Not of an outline (an outline in the color of the canvas is none)
    const withCanvas = !options.auto && canvasColor !== defaultColor;
    if (withCanvas) swatches.append(themeSwatch(canvasColor, `${canvasName} (light / dark)`));
    const graph = cell.graph ?? options.graph;
    [...new Set([...recentColors, ...(graph ? diagramColors(graph) : [])])]
        .filter(color => color !== String(defaultColor).toLowerCase())
        .slice(0, MAX_SWATCHES - (withCanvas ? 1 : 0))
        .forEach(color => swatches.append(createSwatch(color, color, () => pick(color))));
    if (swatches.childElementCount > 0) row.append(swatches);
    return el;
}

/** Whether the field (its element, see `getFieldValue` of the inspector) is a color field */
export function isColorField(attribute: HTMLElement): boolean {
    return attribute.classList.contains('scada-color-field-content');
}

/** The value of a color field (see `isColorField()`): of its native input */
export function getColorFieldValue(attribute: HTMLElement): { value: string } | undefined {
    const input = attribute.querySelector<HTMLInputElement>('input[type="color"]');
    return input ? { value: input.value } : undefined;
}
