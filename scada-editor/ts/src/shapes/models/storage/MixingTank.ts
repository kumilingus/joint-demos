import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type ControlKind } from '../../common/Shape';

// The impeller at the bottom of the shaft
const impellerTransform = 'translate(calc(w / 2), calc(0.8 * h))';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='legs' />
    <rect @selector='body' />
    <path @selector='shaft' />
    <path @selector='impeller' />
    <rect @selector='motor' />
    <text @selector='motorLabel' />
    <text @selector='label' />
`;

/** A tank with an agitator: a motor on top turning an impeller inside. */
export default class MixingTank extends Shape {

    // The accent: the agitator motor
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['motor', 'fill'] };
    }

    // The agitator is switched on and off (it stirs while on, see `animations.ts`).
    get control(): ControlKind {
        return 'power';
    }

    get overflow(): Overflow {
        return { top: 34 };
    }

    get tagPrefix(): string {
        return 'MX';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'MixingTank',
            // What it shows (see `data.ts`)
            data: {
                power: 1
            },
            size: {
                width: 120,
                height: 160
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                legs: {
                    fill: 'none',
                    stroke: 'var(--shape-tank-legs)',
                    strokeWidth: 8,
                    strokeLinecap: 'round',
                    d: 'M 20 calc(h) l -5 10 M calc(w - 20) calc(h) l 5 10'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 120,
                    ry: 10,
                    surfaceStroke: 'edge',
                    strokeWidth: 4,
                    surfaceFill: 'cylinder'
                },
                shaft: {
                    d: 'M calc(w / 2) -6 V calc(0.8 * h)',
                    stroke: '#333',
                    strokeWidth: 4
                },
                impeller: {
                    d: 'M -28 0 C -24 -10 -8 -10 0 0 C 8 10 24 10 28 0 C 24 -10 8 -10 0 0 C -8 10 -24 10 -28 0 Z',
                    transform: impellerTransform,
                    fill: '#777',
                    stroke: '#222',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                motor: {
                    // In the accent of its style (see `style-color.ts`)
                    styleFill: 'accent',
                    x: 'calc(w / 2 - 16)',
                    y: -34,
                    width: 32,
                    height: 28,
                    rx: 4,
                    ry: 4,
                    fill: 'var(--shape-motor)',
                    stroke: '#222',
                    strokeWidth: 2
                },
                motorLabel: {
                    text: 'M',
                    x: 'calc(w / 2)',
                    y: -20,
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fill: '#eee'
                },
                label: {
                    ...labelAttributes,
                    text: 'Mixer',
                    // Below its legs
                    y: 'calc(h + 18)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
