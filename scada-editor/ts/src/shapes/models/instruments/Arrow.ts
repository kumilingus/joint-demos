import { type dia, type g, util } from '@joint/plus';
import { Layer, LABEL_COLOR } from '../../../const';
import Connection from '../Connection';
import { fromStyleAttributes } from '../../attributes/from-style';
import { styleOf } from '../../common/style';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wrapper' fill='none' />
    <path @selector='line' fill='none' />
`;

export type Arrowhead = 'none' | 'arrow' | 'open' | 'circle' | 'diamond';

/**
 * The markers of the arrowheads, at the start of the line (pointing back, at the end turned around by
 * the library): in the color of the arrow (the library fills them with its stroke, see `sourceMarker`).
 * Outside of the line: from its end outwards (`x < 0`) - the line is shorter by their length (see `arrow-connection`),
 * the tip where the arrow points. An open arrow is the exception: its line goes up to its tip (between its arms).
 */
const MARKERS: Record<Exclude<Arrowhead, 'none'>, dia.SVGSimpleMarkerJSON> = {
    arrow: { type: 'path', d: 'M -12 0 L 0 -6 L 0 6 Z', 'stroke-width': 1, 'stroke-linejoin': 'round' },
    open: { type: 'path', d: 'M 12 -6 L 0 0 L 12 6', fill: 'none', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' },
    circle: { type: 'circle', cx: -4, r: 4, 'stroke-width': 1 },
    diamond: { type: 'path', d: 'M -14 0 L -7 -5 L 0 0 L -7 5 Z', 'stroke-width': 1, 'stroke-linejoin': 'round' }
};

/** How far the arrowhead reaches out of the end of the line (see `MARKERS`) */
export const ARROWHEAD_LENGTHS: Record<Arrowhead, number> = { none: 0, arrow: 12, open: 0, circle: 8, diamond: 14 };

/** The marker of the arrowhead (`null`: none) */
export const arrowheadMarker = (arrowhead: Arrowhead): dia.SVGSimpleMarkerJSON | null => (arrowhead === 'none' ? null : { ...MARKERS[arrowhead] });

/** The path without the lengths at its start and its end - not past its middle (a short one stays as long as it can) */
function trimPath(path: g.Path, start: number, end: number): g.Path {
    const half = path.length() / 2;
    let trimmed = path;
    if (start > 0) {
        trimmed = trimmed.divideAtLength(Math.min(start, half))?.[1] ?? trimmed;
    }
    if (end > 0) {
        trimmed = trimmed.divideAtLength(trimmed.length() - Math.min(end, half))?.[0] ?? trimmed;
    }
    return trimmed;
}

/**
 * An arrow: an annotation (from a note to a part of the plant, ...), with an arrowhead at either end
 * (`sourceArrowhead`, `targetArrowhead`, set in the inspector), connected to an element or not.
 */
export default class Arrow extends Connection {

    static attributes: typeof dia.Link.attributes = {
        // Its color (see `style.ts`)
        ...fromStyleAttributes,
        // `arrowheads` in the attributes of the line: its arrowheads (`sourceArrowhead`, `targetArrowhead`) in its color
        // (of its style, else its own) - the markers defined here: the library takes the color of a marker from the
        // `stroke` set on the line, not from one computed
        arrowheads: {
            set(this: dia.LinkView, _arrowheads: boolean, _refBBox: dia.BBox, _node: Element, attrs: Record<string, unknown>) {
                const color = styleOf<string>(this.model, 'color') ?? String(attrs.stroke ?? LABEL_COLOR);
                const marker = (end: 'source' | 'target', turned: boolean) => {
                    const head = arrowheadMarker(this.model.get(`${end}Arrowhead`));
                    if (!head) {
                        return 'none';
                    }
                    // As the library defines them: in the color of the line, the one at the end turned around
                    const definition = { stroke: color, fill: color, ...(turned ? { transform: 'rotate(180)' } : {}), ...head };
                    return this.paper ? `url(#${this.paper.defineMarker(definition)})` : 'none';
                };
                return { 'marker-start': marker('source', false), 'marker-end': marker('target', true) };
            }
        },
        // `arrowConnection` in the attributes of the line (instead of `connection`): the path of the link without the
        // lengths of its arrowheads at its ends - they are outside of it (see `MARKERS`), their tips at the ends (where
        // it points, connected or not; the tools of the ends there too)
        'arrow-connection': {
            set(this: dia.LinkView) {
                const { model } = this;
                const length = (end: 'source' | 'target'): number => {
                    const head: Arrowhead = model.get(`${end}Arrowhead`);
                    return ARROWHEAD_LENGTHS[head] ?? 0;
                };
                return { d: trimPath(this.getConnection(), length('source'), length('target')).serialize() };
            }
        }
    };

    defaults(): dia.Link.Attributes {
        return {
            ...super.defaults,
            type: 'Arrow',
            layer: Layer.Instruments,
            routing: 'straight',
            sourceArrowhead: 'none',
            targetArrowhead: 'arrow',
            attrs: {
                // An invisible wide stroke that makes the thin line easy to grab.
                wrapper: {
                    connection: true,
                    stroke: 'transparent',
                    strokeWidth: 20,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round'
                },
                line: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { stroke: 'color' },
                    // Ends where its arrowheads start (see `arrow-connection`)
                    arrowConnection: true,
                    stroke: LABEL_COLOR,
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round',
                    pointerEvents: 'none',
                    // Of `sourceArrowhead`, `targetArrowhead`
                    arrowheads: true
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    /** Whether the cell is an arrow */
    static isArrow(cell: unknown): cell is Arrow {
        return cell instanceof Arrow;
    }
}
