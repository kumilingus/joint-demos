import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE, sphereGradient } from './gradients';
import type { Overflow } from './footprint';
import { Shape, type ControlKind } from './Shape';

/** A roller of the belt at `cx`, as big as the belt is tall (the shorter side, `s`). */
const roller = (cx: string) => ({
    cx,
    cy: 'calc(h / 2)',
    r: 'calc(s / 2 - 4)',
    fill: sphereGradient,
    stroke: METAL_STROKE,
    strokeWidth: 2
});

/** Where the boxes are on the belt (relative to its width): one step of the carrying apart (see `animations.ts`) */
export const BOX_POSITIONS = [0.2, 0.6];

const box = (x: number) => ({
    x: `calc(${x} * w)`,
    y: -22,
    width: 28,
    height: 22,
    fill: '#c9a26b',
    stroke: '#7a5a32',
    strokeWidth: 1.5
});

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='legs' />
    <rect @selector='body' />
    <circle @selector='roller1' />
    <circle @selector='roller2' />
    <circle @selector='roller3' />
    <rect @selector='box1' />
    <rect @selector='box2' />
    <text @selector='label' />
`;

/** A belt conveyor carrying boxes from the left to the right. */
export class ConveyorBelt extends Shape {

    get control(): ControlKind {
        return 'power';
    }

    get overflow(): Overflow {
        return { top: 22, bottom: 40 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'ConveyorBelt',
            size: {
                width: 200,
                height: 40
            },
            // 0 = off, 1 = on
            power: 0,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                legs: {
                    d: 'M calc(0.15 * w) calc(h / 2) V calc(h + 16) M calc(0.85 * w) calc(h / 2) V calc(h + 16)',
                    stroke: '#555',
                    strokeWidth: 6,
                    strokeLinecap: 'round'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 'calc(s / 2)',
                    ry: 'calc(s / 2)',
                    fill: '#444',
                    stroke: '#222',
                    strokeWidth: 2
                },
                // The end rollers are in the rounded ends of the belt.
                roller1: roller('calc(s / 2)'),
                roller2: roller('calc(w / 2)'),
                roller3: roller('calc(w - calc(s / 2))'),
                box1: box(BOX_POSITIONS[0]),
                box2: box(BOX_POSITIONS[1]),
                label: {
                    ...labelAttributes,
                    text: 'Conveyor',
                    y: 'calc(h + 22)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
