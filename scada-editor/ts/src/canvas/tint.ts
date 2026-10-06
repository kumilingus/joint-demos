import { dia, V } from '@joint/plus';

/*
 * An element tinted in a color: recolored by a filter of its view (its shading kept - the light parts in the color, the
 * dark ones dark) and glowing in it. A highlighter: nothing of the model changes - the shapes share
 * their gradients (a paint server takes the variables where it is defined, not where it is used), so a shape can't be
 * recolored by its variables. E.g. the element of the message clicked in the log (see `LogController`).
 */

const TINT_ID = 'tint';

// How the gray of the element is lifted before it is multiplied by the color (see `defineTint()`)
const TINT_LIFT = { slope: 0.6, intercept: 0.4 };

/** The filters of the colors in the defs of the papers (by the color: a variable of the theme or any CSS color) */
const filterIds = new Map<string, string>();

/**
 * The filter of the color in the defs of the paper: the element in gray multiplied by the color - the light parts in
 * the color, the dark ones dark; its shape (alpha) kept. The color as a CSS property: a variable follows the theme.
 */
function defineTint(paper: dia.Paper, color: string): string {
    let id = filterIds.get(color);
    if (!id) {
        id = `scada-tint-${filterIds.size + 1}`;
        filterIds.set(color, id);
    }
    if (!paper.svg.querySelector(`#${id}`)) {
        V('filter', { id, 'color-interpolation-filters': 'sRGB' }).append([
            V('feColorMatrix', { in: 'SourceGraphic', type: 'saturate', values: 0, result: 'grayscale' }),
            // The gray lifted (black to a dark gray): the dark shapes of the dark scheme in the color too, not near black
            V('feComponentTransfer', { in: 'grayscale', result: 'gray' }).append(
                ['feFuncR', 'feFuncG', 'feFuncB'].map(func => V(func, { type: 'linear', slope: TINT_LIFT.slope, intercept: TINT_LIFT.intercept }))
            ),
            V('feFlood', { style: `flood-color: ${color}`, result: 'color' }),
            V('feBlend', { in: 'color', in2: 'gray', mode: 'multiply', result: 'tinted' }),
            V('feComposite', { in: 'tinted', in2: 'SourceGraphic', operator: 'in' })
        ]).appendTo(paper.defs);
    }
    return id;
}

/** The tint: the class of the view (`.tint` in `canvas.css`), its filter and its color as its variables */
const Tint = dia.HighlighterView.extend({
    // Nothing of its own: the view of the element is tinted
    MOUNTABLE: false,
    highlight(this: dia.HighlighterView, cellView: dia.CellView) {
        const { color, filter } = this.options as { color: string; filter: string };
        const { el } = cellView;
        el.classList.add('scada-tint');
        el.style.setProperty('--tint-color', color);
        el.style.setProperty('--tint-filter', `url(#${filter})`);
    },
    unhighlight(this: dia.HighlighterView, cellView: dia.CellView) {
        const { el } = cellView;
        el.classList.remove('scada-tint');
        el.style.removeProperty('--tint-color');
        el.style.removeProperty('--tint-filter');
    }
});

/** The element tinted in the color (e.g. `var(--selection)`, `var(--color-red)`), or not (`null`) */
export function setTint(paper: dia.Paper, element: dia.Element, color: string | null): void {
    const view = element.findView(paper);
    if (!view) return;
    Tint.remove(view, TINT_ID);
    if (color === null) return;
    Tint.add(view, 'root', TINT_ID, { color, filter: defineTint(paper, color) });
}
