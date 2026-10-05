import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type ControlKind } from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

/** The pattern of the buckets on the chain: their height along it and the gap after each (see `animations.ts`) */
export const BUCKET_PATTERN = [10, 14];

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='casing' />
    <rect @selector='window' />
    <path @selector='buckets' />
    <g @group-selector='directional'>
        <path @selector='discharge' />
    </g>
    <rect @selector='head' />
    <circle @selector='headPulley' />
    <g @group-selector='directional'>
        <path @selector='feed' />
    </g>
    <rect @selector='boot' />
    <circle @selector='bootPulley' />
    <text @selector='label' />
`;

/**
 * A bucket elevator: the buckets on a chain lift the material fed in at the boot (bottom left) up to the head,
 * it pours out of the discharge chute (top right). While it runs (`power`) the buckets go up in the runtime mode.
 */
export default class BucketElevator extends Shape {

    // Mirrored horizontally (see `flip.ts`): facing the other way
    get flippable(): Flip {
        return 'x';
    }

    // The accent: the buckets
    get accentField(): ColorField {
        return { path: ['attrs', 'buckets', 'stroke'] };
    }

    get control(): ControlKind {
        return 'power';
    }

    get overflow(): Overflow {
        return { right: 30, left: 30 };
    }

    get tagPrefix(): string {
        return 'BE';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'BucketElevator',
            size: {
                width: 80,
                height: 300
            },
            // 0 = off, 1 = on
            power: 0,
            attrs: {
                // The parts showing which way it faces: mirrored when it is flipped (see `flip.ts`)
                directional: {
                    flip: true
                },
                root: {
                    magnetSelector: 'casing'
                },
                casing: {
                    x: 'calc(0.2 * w)',
                    y: 30,
                    width: 'calc(0.6 * w)',
                    height: 'calc(h - 60)',
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                window: {
                    x: 'calc(0.32 * w)',
                    y: 36,
                    width: 'calc(0.36 * w)',
                    height: 'calc(h - 72)',
                    fill: '#2b2f33'
                },
                // The buckets going up the chain: a dashed stroke from the boot to the head (see `BUCKET_PATTERN`)
                buckets: {
                    d: 'M calc(0.5 * w) calc(h - 38) V 38',
                    stroke: 'var(--shape-bucket)',
                    strokeWidth: 24,
                    strokeDasharray: BUCKET_PATTERN.join(' ')
                },
                discharge: {
                    d: 'M calc(0.9 * w) 8 L calc(w + 30) 34 V 50 L calc(0.9 * w) 30 Z',
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                head: {
                    x: 'calc(0.1 * w)',
                    width: 'calc(0.8 * w)',
                    height: 36,
                    rx: 'calc(0.4 * w)',
                    ry: 18,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                headPulley: {
                    cx: 'calc(0.5 * w)',
                    cy: 18,
                    r: 'calc(0.18 * w)',
                    surfaceFill: 'sphere',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                feed: {
                    d: 'M calc(0.1 * w) calc(h - 34) L -30 calc(h - 58) V calc(h - 42) L calc(0.1 * w) calc(h - 16) Z',
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                boot: {
                    x: 'calc(0.1 * w)',
                    y: 'calc(h - 36)',
                    width: 'calc(0.8 * w)',
                    height: 36,
                    rx: 4,
                    ry: 4,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                bootPulley: {
                    cx: 'calc(0.5 * w)',
                    cy: 'calc(h - 18)',
                    r: 'calc(0.18 * w)',
                    surfaceFill: 'sphere',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    text: 'Bucket Elevator'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
