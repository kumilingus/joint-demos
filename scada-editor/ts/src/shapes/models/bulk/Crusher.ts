import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type ControlKind, type Resizable } from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

// The spokes of the flywheel, around its hub
const SPOKES = Array.from({ length: 6 }, (_, i) => {
    const angle = i * Math.PI / 3;
    return `M 0 0 L ${(20 * Math.cos(angle)).toFixed(2)} ${(20 * Math.sin(angle)).toFixed(2)}`;
}).join(' ');

/** Where the flywheel is (its hub, relative to the size): beside the frame, on the shaft of the moving jaw */
const FLYWHEEL = { x: 0.86, y: 0.3 };

/** Where the moving jaw swings from: the top of it (relative to the size) */
export const JAW_PIVOT = { x: 0.7, y: 0.08 };

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='base' />
    <g @group-selector='directional'>
        <path @selector='body' />
        <path @selector='chamber' />
        <path @selector='rocks' />
        <path @selector='fixedJaw' />
        <path @selector='movingJaw' />
        <circle @selector='flywheel' />
        <g @selector='spokesGroup'>
            <path @selector='spokes' />
        </g>
    </g>
    <text @selector='label' />
`;

/**
 * A jaw crusher: the rocks fed from the top are crushed between the fixed jaw and the moving one, the flywheel
 * swings the moving jaw (in the runtime mode, while it runs).
 */
export default class Crusher extends Shape {

    // Mirrored horizontally (see `flip.ts`): facing the other way
    get flippable(): Flip {
        return 'x';
    }

    // The accent: the rocks in it
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['rocks', 'fill'] };
    }

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'power';
    }

    get overflow(): Overflow {
        return { right: 8 };
    }

    get tagPrefix(): string {
        return 'CR';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Crusher',
            // Its label (see `text-from`)
            label: { text: 'Crusher' },
            // What it shows (see `data.ts`)
            data: {
                // 0 = off, 1 = on
                power: 0
            },
            size: {
                width: 140,
                height: 120
            },
            attrs: {
                // The parts showing which way it faces: mirrored when it is flipped (see `flip.ts`)
                directional: {
                    flip: true
                },
                root: {
                    magnetSelector: 'body'
                },
                base: {
                    d: 'M calc(0.12 * w) calc(h) L calc(0.2 * w) calc(0.7 * h) H calc(0.8 * w) L calc(0.88 * w) calc(h) Z',
                    fill: 'var(--shape-support)',
                    stroke: '#333',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                // The frame: wide at the top, the crushed rock falls out of the narrow bottom
                body: {
                    d: 'M calc(0.08 * w) 0 H calc(0.78 * w) L calc(0.64 * w) calc(0.76 * h) H calc(0.22 * w) Z',
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                chamber: {
                    d: 'M calc(0.18 * w) calc(0.08 * h) H calc(0.68 * w) L calc(0.48 * w) calc(0.7 * h) H calc(0.38 * w) Z',
                    fill: '#2b2f33'
                },
                rocks: {
                    // In the accent of its style (see `style-color.ts`)
                    styleFill: 'accent',
                    d: [
                        'M calc(0.26 * w) calc(0.2 * h) l 10 -8 l 12 4 l -2 12 l -14 2 Z',
                        'M calc(0.44 * w) calc(0.16 * h) l 12 -4 l 8 10 l -10 8 l -10 -4 Z',
                        'M calc(0.38 * w) calc(0.36 * h) l 8 -6 l 8 6 l -6 8 Z',
                        'M calc(0.41 * w) calc(0.52 * h) l 6 -4 l 5 5 l -5 5 Z'
                    ].join(' '),
                    fill: 'var(--shape-hopper-material)',
                    stroke: '#5e4f3d',
                    strokeWidth: 1
                },
                fixedJaw: {
                    d: 'M calc(0.18 * w) calc(0.08 * h) L calc(0.38 * w) calc(0.7 * h)',
                    surfaceStroke: 'edge',
                    strokeWidth: 5,
                    strokeLinecap: 'round'
                },
                // The moving jaw swings around its top (see `JAW_PIVOT`, `animations.ts`)
                movingJaw: {
                    d: `M calc(${JAW_PIVOT.x} * w) calc(${JAW_PIVOT.y} * h) L calc(0.5 * w) calc(0.7 * h)`,
                    surfaceStroke: 'edge',
                    strokeWidth: 5,
                    strokeLinecap: 'round'
                },
                flywheel: {
                    cx: `calc(${FLYWHEEL.x} * w)`,
                    cy: `calc(${FLYWHEEL.y} * h)`,
                    r: 26,
                    surfaceFill: 'sphere',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                // The spokes turn in their group (see `animations.ts`), which moves them to the hub.
                spokesGroup: {
                    transform: `translate(calc(${FLYWHEEL.x} * w), calc(${FLYWHEEL.y} * h))`
                },
                spokes: {
                    d: SPOKES,
                    surfaceStroke: 'edge',
                    strokeWidth: 3,
                    strokeLinecap: 'round'
                },
                label: {
                    ...labelAttributes
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
