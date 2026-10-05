import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape from '../../common/Shape';

/** The steam thins out as it rises. */
const steamGradient: dia.SVGGradientJSON = {
    type: 'linearGradient',
    stops: [
        { offset: '0%', color: 'var(--shape-plume)', opacity: 0.6 },
        { offset: '100%', color: 'var(--shape-plume)', opacity: 1 }
    ],
    attrs: {
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
    }
};

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wisp' />
    <path @selector='plume' />
    <path @selector='plumeShade' />
    <path @selector='body' />
    <path @selector='inlets' />
    <rect @selector='base' />
    <text @selector='label' />
`;

/** A hyperboloid cooling tower with steam coming out of it. */
export default class CoolingTower extends Shape {

    get overflow(): Overflow {
        return { top: 72, right: 12, bottom: 36, left: 8 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'CoolingTower',
            // Its label (see `text-from`)
            label: { text: 'Cooling Tower' },
            size: {
                width: 140,
                height: 160
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                // The plume rises from inside the tower: its bottom is hidden behind the body.
                plume: {
                    d: [
                        'M calc(0.2 * w) 10',
                        'C calc(0.06 * w) 0 calc(0.1 * w) -30 calc(0.26 * w) -28',
                        'C calc(0.26 * w) -50 calc(0.5 * w) -58 calc(0.58 * w) -40',
                        'C calc(0.7 * w) -58 calc(0.94 * w) -48 calc(0.88 * w) -26',
                        'C calc(w) -20 calc(0.94 * w) 4 calc(0.8 * w) 10',
                        'Z'
                    ].join(' '),
                    fill: steamGradient,
                    stroke: '#d3dbe1',
                    strokeWidth: 1.5,
                    strokeLinejoin: 'round'
                },
                // The underside of the plume is in its own shadow.
                plumeShade: {
                    d: [
                        'M calc(0.22 * w) 10',
                        'C calc(0.2 * w) -8 calc(0.4 * w) -12 calc(0.5 * w) -4',
                        'C calc(0.62 * w) -14 calc(0.82 * w) -8 calc(0.8 * w) 10',
                        'Z'
                    ].join(' '),
                    fill: '#dfe6eb',
                    fillOpacity: 0.8
                },
                // A wisp drifting away with the wind
                wisp: {
                    d: [
                        'M calc(0.78 * w) -54',
                        'C calc(0.84 * w) -70 calc(1.02 * w) -72 calc(1.04 * w) -60',
                        'C calc(1.08 * w) -52 calc(0.9 * w) -46 calc(0.78 * w) -54',
                        'Z'
                    ].join(' '),
                    fill: '#fff',
                    fillOpacity: 0.7,
                    stroke: '#d3dbe1',
                    strokeOpacity: 0.7,
                    strokeWidth: 1
                },
                body: {
                    d: [
                        'M 0 calc(h)',
                        'C calc(0.25 * w) calc(0.55 * h) calc(0.25 * w) calc(0.3 * h) calc(0.12 * w) 0',
                        'H calc(0.88 * w)',
                        'C calc(0.75 * w) calc(0.3 * h) calc(0.75 * w) calc(0.55 * h) calc(w) calc(h)',
                        'Z'
                    ].join(' '),
                    surfaceStroke: 'edge',
                    strokeWidth: 3,
                    strokeLinejoin: 'round',
                    surfaceFill: 'cylinder'
                },
                // The air inlets around the bottom
                inlets: {
                    d: 'M calc(0.08 * w) calc(h - 10) H calc(0.92 * w)',
                    stroke: '#555',
                    strokeWidth: 8,
                    strokeDasharray: '8,6'
                },
                base: {
                    x: -8,
                    y: 'calc(h - 4)',
                    width: 'calc(w + 16)',
                    height: 12,
                    surfaceFill: 'pale',
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 2
                },
                label: {
                    ...labelAttributes,
                    y: 'calc(h + 18)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
