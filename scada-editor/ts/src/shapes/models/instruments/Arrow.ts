import { dia, type g, util } from '@joint/plus';
import { Layer, LABEL_COLOR } from '../../../const';
import { type ColorField, LINE_COLOR_FIELD } from '../../common/Shape';
import { fromStyleAttributes } from '../../attributes/from-style';
import { styleOf } from '../../common/style';
import LinkView from '../../views/LinkView';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wrapper' fill='none' />
    <path @selector='line' fill='none' />
`;

export type Arrowhead = 'none' | 'arrow' | 'open' | 'circle' | 'diamond';

/**
 * The markers of the arrowheads, at the start of the line (pointing back, at the end turned around by
 * the library): in the color of the arrow (the library fills them with its stroke, see `sourceMarker`).
 * Outside of the line: from its end outwards (`x < 0`) - the line is shorter by their length (see `ArrowView`),
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

/**
 * An arrow: an annotation (from a note to a part of the plant, ...), with an arrowhead at either end
 * (`sourceArrowhead`, `targetArrowhead`, set in the inspector), free or connected to an element.
 */
export default class Arrow extends dia.Link {

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
                    const head = arrowheadMarker(this.model.get(`${end}Arrowhead`) as Arrowhead);
                    if (!head) return 'none';
                    // As the library defines them: in the color of the line, the one at the end turned around
                    const definition = { stroke: color, fill: color, ...(turned ? { transform: 'rotate(180)' } : {}), ...head };
                    return `url(#${this.paper!.defineMarker(definition as dia.SVGMarkerJSON)})`;
                };
                return { 'marker-start': marker('source', false), 'marker-end': marker('target', true) };
            }
        }
    };

    // The color of its line (see `ColorField`)
    get colorField(): ColorField {
        return LINE_COLOR_FIELD;
    }

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
                    connection: true,
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
}

/** The end of the line moved back from the point it points at (towards the next point): by the length of the arrowhead */
function shorten(point: g.Point, next: g.Point, length: number): g.Point {
    // Not past the middle of a short segment
    const distance = Math.min(length, point.distance(next) / 2);
    return distance > 0 ? point.clone().move(next, -distance) : point;
}

/**
 * The view of an arrow: its line (the path) ends where its arrowheads start - they are outside of it (see
 * `MARKERS`), their tips at the ends (where it points, connected or not; the tools of the ends there too).
 */
export const ArrowView = LinkView.extend({
    // Drawn again when its arrowheads change too (see `arrowheads`)
    presentationAttributes: LinkView.addPresentationAttributes({
        sourceArrowhead: dia.LinkView.Flags.UPDATE,
        targetArrowhead: dia.LinkView.Flags.UPDATE
    }),
    findPath(this: dia.LinkView, route: g.Point[], sourcePoint: g.Point, targetPoint: g.Point) {
        const { model } = this;
        const length = (end: 'source' | 'target') => ARROWHEAD_LENGTHS[model.get(`${end}Arrowhead`) as Arrowhead] ?? 0;
        const source = shorten(sourcePoint, route[0] ?? targetPoint, length('source'));
        const target = shorten(targetPoint, route[route.length - 1] ?? sourcePoint, length('target'));
        return dia.LinkView.prototype.findPath.call(this, route, source, target);
    }
});
