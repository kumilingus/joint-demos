import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE, cylinderGradient } from './gradients';
import type { Overflow } from './footprint';
import Shape from './Shape';

// The stack narrows from the full width at the bottom to 60% of it at the top.
const TAPER = 0.2;

const BAND_COLOR = '#ED2637';

/**
 * A band across the stack between the relative heights `from` and `to` (0 = top, 1 = bottom).
 * The sides follow the taper: at the relative height `y` the stack is `TAPER * (1 - y)` narrower on each side.
 */
function band(from: number, to: number): string {
    const inset = (y: number) => TAPER * (1 - y);
    return [
        `M calc(${inset(from)} * w) calc(${from} * h)`,
        `H calc(${1 - inset(from)} * w)`,
        `L calc(${1 - inset(to)} * w) calc(${to} * h)`,
        `H calc(${inset(to)} * w)`,
        'Z'
    ].join(' ');
}

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <g @selector='smoke'>
        <circle @selector='smoke1' />
        <circle @selector='smoke2' />
        <circle @selector='smoke3' />
    </g>
    <path @selector='body' />
    <path @selector='bands' />
    <rect @selector='cap' />
    <rect @selector='base' />
    <text @selector='label' />
`;

export default class Chimney extends Shape {

    get overflow(): Overflow {
        return { top: 78, right: 16, bottom: 36, left: 8 };
    }

    get tagPrefix(): string {
        return 'ST';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Chimney',
            size: {
                width: 60,
                height: 240
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                smoke: {
                    fill: 'var(--shape-smoke)',
                    fillOpacity: 'var(--shape-smoke-opacity)',
                    stroke: 'none'
                },
                smoke1: {
                    cx: 'calc(0.5 * w)',
                    cy: -22,
                    r: 10
                },
                smoke2: {
                    cx: 'calc(0.5 * w + 12)',
                    cy: -40,
                    r: 13
                },
                smoke3: {
                    cx: 'calc(0.5 * w + 30)',
                    cy: -62,
                    r: 16
                },
                body: {
                    d: `M 0 calc(h) L calc(${TAPER} * w) 0 H calc(${1 - TAPER} * w) L calc(w) calc(h) Z`,
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    fill: cylinderGradient
                },
                bands: {
                    d: `${band(0.06, 0.12)} ${band(0.18, 0.24)}`,
                    fill: BAND_COLOR,
                    fillOpacity: 0.85,
                    stroke: 'none'
                },
                cap: {
                    x: `calc(${TAPER} * w - 4)`,
                    y: -8,
                    width: `calc(${1 - 2 * TAPER} * w + 8)`,
                    height: 10,
                    rx: 2,
                    ry: 2,
                    fill: '#666',
                    stroke: '#333',
                    strokeWidth: 2
                },
                base: {
                    x: -8,
                    y: 'calc(h - 4)',
                    width: 'calc(w + 16)',
                    height: 12,
                    fill: '#999',
                    stroke: '#555',
                    strokeWidth: 2
                },
                label: {
                    ...labelAttributes,
                    text: 'Chimney',
                    y: 'calc(h + 18)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
