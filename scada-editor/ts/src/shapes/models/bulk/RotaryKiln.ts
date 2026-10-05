import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type ControlKind, type Resizable } from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

// The shell of the kiln: its top and its height (relative to the height of the element)
const SHELL_Y = 0.12;
const SHELL_HEIGHT = 0.5;
const SHELL_MIDDLE = `calc(${SHELL_Y + SHELL_HEIGHT / 2} * h)`;

/** A riding ring around the shell at a part of the width, carried by a pier under it */
const tyre = (x: number) => ({
    x: `calc(${x} * w - 7)`,
    y: `calc(${SHELL_Y - 0.06} * h)`,
    width: 14,
    height: `calc(${SHELL_HEIGHT + 0.12} * h)`,
    rx: 3,
    ry: 3,
    surfaceFill: 'mid',
    surfaceStroke: 'edge',
    strokeWidth: 1.5
});

/** The pier under a riding ring at a part of the width */
const pier = (x: number) => `M calc(${x} * w - 18) calc(h) L calc(${x} * w - 10) calc(0.68 * h) H calc(${x} * w + 10) L calc(${x} * w + 18) calc(h) Z`;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <g @group-selector='directional'>
        <path @selector='piers' />
        <rect @selector='shell' />
        <rect @selector='hotZone' />
        <rect @selector='tyre1' />
        <rect @selector='tyre2' />
        <rect @selector='girthGear' />
        <rect @selector='inlet' />
        <rect @selector='hood' />
        <rect @selector='burner' />
        <path @selector='flameOuter' />
        <path @selector='flameInner' />
    </g>
    <text @selector='label' />
`;

/**
 * A rotary kiln: a long drum turning on its riding rings, the material fed in at the inlet (on the left)
 * and burnt by the flame of the burner in the hood (on the right). While it runs (`power`) the flame burns
 * and the hot zone glows in the runtime mode.
 */
export default class RotaryKiln extends Shape {

    // Mirrored horizontally (see `flip.ts`): facing the other way
    get flippable(): Flip {
        return 'x';
    }

    // The accent: the piers
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['piers', 'fill'] };
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get control(): ControlKind {
        return 'power';
    }

    get overflow(): Overflow {
        return { right: 24 };
    }

    get tagPrefix(): string {
        return 'KL';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'RotaryKiln',
            // What it shows (see `data.ts`)
            data: {
                // 0 = off, 1 = on
                power: 0
            },
            size: {
                width: 420,
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
                    // In the accent of its style (see `style-color.ts`)
                    styleFill: 'accent',
                    d: `${pier(0.27)} ${pier(0.67)}`,
                    fill: 'var(--shape-support)',
                    stroke: '#333',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                shell: {
                    x: 'calc(0.06 * w)',
                    y: `calc(${SHELL_Y} * h)`,
                    width: 'calc(0.84 * w)',
                    height: `calc(${SHELL_HEIGHT} * h)`,
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                // The burning zone near the hood, hot through the shell
                hotZone: {
                    x: 'calc(0.62 * w)',
                    y: `calc(${SHELL_Y} * h + 2)`,
                    width: 'calc(0.28 * w)',
                    height: `calc(${SHELL_HEIGHT} * h - 4)`,
                    fill: 'var(--shape-flame)',
                    fillOpacity: 0.3,
                    pointerEvents: 'none'
                },
                tyre1: tyre(0.27),
                tyre2: tyre(0.67),
                // The girth gear the drive turns the kiln by
                girthGear: {
                    x: 'calc(0.47 * w - 6)',
                    y: `calc(${SHELL_Y - 0.08} * h)`,
                    width: 12,
                    height: `calc(${SHELL_HEIGHT + 0.16} * h)`,
                    rx: 2,
                    ry: 2,
                    surfaceFill: 'dark',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                // The inlet housing the material comes in through
                inlet: {
                    y: 0,
                    width: 'calc(0.08 * w)',
                    height: 'calc(0.74 * h)',
                    rx: 3,
                    ry: 3,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                // The hood with the burner at the end the clinker drops out of
                hood: {
                    x: 'calc(0.88 * w)',
                    y: 0,
                    width: 'calc(0.12 * w)',
                    height: 'calc(0.86 * h)',
                    rx: 3,
                    ry: 3,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                burner: {
                    x: 'calc(w)',
                    y: `calc(${SHELL_Y + SHELL_HEIGHT / 2} * h - 5)`,
                    width: 24,
                    height: 10,
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                // The flame of the burner, into the kiln
                flameOuter: {
                    d: `M calc(0.9 * w) calc(${SHELL_Y + 0.08} * h) Q calc(0.7 * w) ${SHELL_MIDDLE} calc(0.9 * w) calc(${SHELL_Y + SHELL_HEIGHT - 0.08} * h) Z`,
                    fill: 'var(--shape-flame)',
                    pointerEvents: 'none'
                },
                flameInner: {
                    d: `M calc(0.9 * w) calc(${SHELL_Y + 0.15} * h) Q calc(0.78 * w) ${SHELL_MIDDLE} calc(0.9 * w) calc(${SHELL_Y + SHELL_HEIGHT - 0.15} * h) Z`,
                    fill: 'color-mix(in oklab, var(--shape-flame) 60%, #b91c1c)',
                    pointerEvents: 'none'
                },
                label: {
                    ...labelAttributes,
                    text: 'Rotary Kiln'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
