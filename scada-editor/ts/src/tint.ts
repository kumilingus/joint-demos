import { type dia, highlighters, V } from '@joint/plus';

/*
 * An element tinted: recolored by a filter of its view (its shading kept - the highlights light, the edges dark) and
 * glowing. A highlighter: nothing of the model changes - the shapes share their gradients (a paint server takes the
 * variables where it is defined, not where it is used), so a shape can't be recolored by its variables.
 * - `alarm`: red, pulsing (an element in alarm)
 * - `focus`: blue (the element of a message of the log under the pointer, see `LogController`)
 */

export type TintKind = 'alarm' | 'focus';

/** The tints: the brightness of each pixel in the color (rows of `feColorMatrix`: red, green, blue, alpha) */
const TINT_MATRICES: Record<TintKind, string[]> = {
    alarm: [
        '0.33 0.60 0.12 0 0.18',
        '0.08 0.15 0.03 0 0',
        '0.08 0.15 0.03 0 0',
        '0 0 0 1 0'
    ],
    focus: [
        '0.03 0.06 0.01 0 0',
        '0.15 0.30 0.05 0 0.12',
        '0.33 0.60 0.12 0 0.30',
        '0 0 0 1 0'
    ]
};

const filterId = (kind: TintKind) => `jj-tint-${kind}`;

/** The filter of the tint in the defs of the paper (`.jj-tint-*` in `styles.css` applies it, with the glow) */
function defineTint(paper: dia.Paper, kind: TintKind): void {
    if (paper.svg.querySelector(`#${filterId(kind)}`)) return;
    V('filter', { id: filterId(kind), 'color-interpolation-filters': 'sRGB' })
        .append(V('feColorMatrix', { type: 'matrix', values: TINT_MATRICES[kind].join(' ') }))
        .appendTo(paper.defs);
}

/** The element tinted (of the kind), or not */
export function setTint(paper: dia.Paper, element: dia.Element, kind: TintKind, tinted: boolean): void {
    const view = element.findView(paper);
    if (!view) return;
    const id = `tint-${kind}`;
    highlighters.addClass.remove(view, id);
    if (!tinted) return;
    defineTint(paper, kind);
    highlighters.addClass.add(view, 'root', id, { className: `jj-tint-${kind}` });
}
