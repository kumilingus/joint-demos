import { dia, V } from '@joint/plus';

/*
 * An element tinted in a color: recolored by a filter of its view (its shading kept - the light parts in the color, the
 * dark ones dark) and glowing in it, pulsing if asked. A highlighter: nothing of the model changes - the shapes share
 * their gradients (a paint server takes the variables where it is defined, not where it is used), so a shape can't be
 * recolored by its variables. E.g. the element of a message of the log under the pointer (see `LogController`).
 */

export interface TintOptions {
    /** Pulsing (its glow growing and shrinking) */
    pulse?: boolean;
}

const TINT_ID = 'tint';

/** The filters of the colors in the defs of the papers (by the color: a variable of the theme or any CSS color) */
const filterIds = new Map<string, string>();

/**
 * The filter of the color in the defs of the paper: the element in gray multiplied by the color - the light parts in
 * the color, the dark ones dark; its shape (alpha) kept. The color as a CSS property: a variable follows the theme.
 */
function defineTint(paper: dia.Paper, color: string): string {
    let id = filterIds.get(color);
    if (!id) {
        id = `jj-tint-${filterIds.size + 1}`;
        filterIds.set(color, id);
    }
    if (!paper.svg.querySelector(`#${id}`)) {
        V('filter', { id, 'color-interpolation-filters': 'sRGB' }).append([
            V('feColorMatrix', { in: 'SourceGraphic', type: 'saturate', values: 0, result: 'gray' }),
            V('feFlood', { style: `flood-color: ${color}`, result: 'color' }),
            V('feBlend', { in: 'color', in2: 'gray', mode: 'multiply', result: 'tinted' }),
            V('feComposite', { in: 'tinted', in2: 'SourceGraphic', operator: 'in' })
        ]).appendTo(paper.defs);
    }
    return id;
}

/** The tint: the class of the view (`.jj-tint` in `styles.css`), its filter and its color as its variables */
const Tint = dia.HighlighterView.extend({
    // Nothing of its own: the view of the element is tinted
    MOUNTABLE: false,
    highlight(this: dia.HighlighterView, cellView: dia.CellView) {
        const { color, filter, pulse } = this.options as { color: string; filter: string; pulse: boolean };
        const { el } = cellView;
        el.classList.add('jj-tint');
        el.classList.toggle('jj-tint-pulse', pulse);
        el.style.setProperty('--jj-tint-color', color);
        el.style.setProperty('--jj-tint-filter', `url(#${filter})`);
    },
    unhighlight(this: dia.HighlighterView, cellView: dia.CellView) {
        const { el } = cellView;
        el.classList.remove('jj-tint', 'jj-tint-pulse');
        el.style.removeProperty('--jj-tint-color');
        el.style.removeProperty('--jj-tint-filter');
    }
});

/** The element tinted in the color (e.g. `var(--selection)`, `var(--color-red)`), or not (`null`) */
export function setTint(paper: dia.Paper, element: dia.Element, color: string | null, { pulse = false }: TintOptions = {}): void {
    const view = element.findView(paper);
    if (!view) return;
    Tint.remove(view, TINT_ID);
    if (color === null) return;
    Tint.add(view, 'root', TINT_ID, { color, filter: defineTint(paper, color), pulse });
}
