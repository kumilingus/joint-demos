import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type ControlKind, type Resizable } from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

/** The pattern of the liners inside the drum: their width along it and the gap after each (see `animations.ts`) */
export const LINER_PATTERN = [4, 16];

/** A pier under the drum at a part of the width */
const pier = (x: number) => `M calc(${x} * w - 16) calc(h) L calc(${x} * w - 8) calc(0.6 * h) H calc(${x} * w + 8) L calc(${x} * w + 16) calc(h) Z`;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='piers' />
    <rect @selector='trunnions' />
    <rect @selector='shell' />
    <path @selector='liners' />
    <g @group-selector='directional'>
        <rect @selector='girthGear' />
        <rect @selector='inlet' />
        <rect @selector='outlet' />
    </g>
    <text @selector='label' />
`;

/**
 * A ball mill: a turning drum grinding the material fed in on the left with the steel balls in it, the powder
 * out on the right. While it runs (`power`) the liners inside move round with the drum in the runtime mode.
 */
export default class Mill extends Shape {

    // Mirrored horizontally (see `flip.ts`): facing the other way
    get flippable(): Flip {
        return 'x';
    }

    // The accent: the piers
    get accentField(): ColorField {
        return { path: ['attrs', 'piers', 'fill'] };
    }

    // The liners are a stroke as wide as the drum is tall: not resized
    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'power';
    }

    get overflow(): Overflow {
        return { top: 10 };
    }

    get tagPrefix(): string {
        return 'ML';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Mill',
            // What it shows (see `data.ts`)
            data: {
                // 0 = off, 1 = on
                power: 0
            },
            size: {
                width: 240,
                height: 100
            },
            attrs: {
                // The parts showing which way it faces: mirrored when it is flipped (see `flip.ts`)
                directional: {
                    flip: true
                },
                root: {
                    magnetSelector: 'shell'
                },
                piers: {
                    d: `${pier(0.08)} ${pier(0.92)}`,
                    fill: 'var(--shape-support)',
                    stroke: '#333',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                // The hollow shafts the drum turns on (and the material goes in and out through)
                trunnions: {
                    y: 'calc(0.3 * h)',
                    width: 'calc(w)',
                    height: 'calc(0.2 * h)',
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                shell: {
                    x: 'calc(0.14 * w)',
                    y: 'calc(0.08 * h)',
                    width: 'calc(0.72 * w)',
                    height: 'calc(0.64 * h)',
                    rx: 8,
                    ry: 8,
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                // The liners across the drum: a dashed stroke as wide as it is tall (see `LINER_PATTERN`)
                liners: {
                    d: 'M calc(0.14 * w + 6) calc(0.4 * h) H calc(0.86 * w - 6)',
                    stroke: 'var(--shape-metal-dark-edge)',
                    strokeOpacity: 0.35,
                    strokeWidth: 52,
                    strokeDasharray: LINER_PATTERN.join(' '),
                    pointerEvents: 'none'
                },
                girthGear: {
                    x: 'calc(0.68 * w - 6)',
                    y: 0,
                    width: 12,
                    height: 'calc(0.8 * h)',
                    rx: 2,
                    ry: 2,
                    surfaceFill: 'dark',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                // The feed chute on the left, the discharge on the right
                inlet: {
                    x: 'calc(0.02 * w)',
                    y: -10,
                    width: 16,
                    height: 'calc(0.3 * h + 10)',
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                outlet: {
                    x: 'calc(0.98 * w - 16)',
                    y: 'calc(0.5 * h)',
                    width: 16,
                    height: 'calc(0.3 * h)',
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    text: 'Mill'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
