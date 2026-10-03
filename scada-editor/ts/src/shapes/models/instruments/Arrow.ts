import { dia, util } from '@joint/plus';
import { Layer, LABEL_COLOR } from '../../../const';
import { DERIVED, followRouting, routingAttributes } from '../../common/routing';
import { type ColorField, LINE_COLOR_FIELD } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wrapper' fill='none' />
    <path @selector='line' fill='none' />
`;

export type Arrowhead = 'none' | 'arrow' | 'open' | 'circle' | 'diamond';

/**
 * The markers of the arrowheads, at the start of the line (pointing back, at the end turned around by
 * the library): in the color of the arrow (the library fills them with its stroke, see `sourceMarker`).
 */
// How far a pointed arrowhead reaches past the end of the line: the line (its round cap) ends inside it.
const TIP = 4;

const MARKERS: Record<Exclude<Arrowhead, 'none'>, dia.SVGSimpleMarkerJSON> = {
    arrow: { type: 'path', d: `M ${-TIP} 0 L ${12 - TIP} -6 L ${12 - TIP} 6 Z`, 'stroke-width': 1, 'stroke-linejoin': 'round' },
    open: { type: 'path', d: `M ${12 - TIP} -6 L ${-TIP} 0 L ${12 - TIP} 6`, fill: 'none', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' },
    circle: { type: 'circle', r: 4, 'stroke-width': 1 },
    diamond: { type: 'path', d: `M ${-TIP} 0 L ${7 - TIP} -5 L ${14 - TIP} 0 L ${7 - TIP} 5 Z`, 'stroke-width': 1, 'stroke-linejoin': 'round' }
};

/** The marker of the arrowhead (`null`: none) */
export const arrowheadMarker = (arrowhead: Arrowhead): dia.SVGSimpleMarkerJSON | null => (arrowhead === 'none' ? null : { ...MARKERS[arrowhead] });

/**
 * An arrow: an annotation (from a note to a part of the plant, ...), with an arrowhead at either end
 * (`sourceArrowhead`, `targetArrowhead`, set in the inspector), free or connected to an element.
 */
export default class Arrow extends dia.Link {

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
            ...routingAttributes('straight'),
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
                    connection: true,
                    stroke: LABEL_COLOR,
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round',
                    pointerEvents: 'none',
                    sourceMarker: arrowheadMarker('none'),
                    targetMarker: arrowheadMarker('arrow')
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Link['initialize']>): void {
        super.initialize(...args);
        followRouting(this);
        // The markers follow the arrowheads (derived changes, not in the history).
        // Replaced (not merged: an arrow keeps no `fill` of an open one).
        (['source', 'target'] as const).forEach((end) => {
            this.on(`change:${end}Arrowhead`, (_line: dia.Link, arrowhead: Arrowhead, options: dia.Cell.Options) => {
                this.prop(['attrs', 'line', `${end}Marker`], arrowheadMarker(arrowhead), { ...options, ...DERIVED, rewrite: true });
            });
        });
    }
}
