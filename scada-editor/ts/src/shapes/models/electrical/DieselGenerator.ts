import { type dia, util } from '@joint/plus';
import { pipePorts, terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type ControlKind, type Resizable } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <g @selector='smoke'>
        <circle @selector='smoke1' />
        <circle @selector='smoke2' />
    </g>
    <rect @selector='exhaust' />
    <rect @selector='skid' />
    <rect @selector='engine' />
    <path @selector='grille' />
    <rect @selector='alternator' />
    <path @selector='ribs' />
    <text @selector='label' />
`;

/**
 * A diesel generator set: an engine and an alternator on a skid, a source of the power while it runs
 * (switched in the runtime mode, the exhaust smokes). The fuel comes in by the pipe on the left.
 */
export default class DieselGenerator extends Shape {

    // The accent: the skid
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['skid', 'fill'] };
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get control(): ControlKind {
        return 'power';
    }

    get stubLength(): number {
        return 20;
    }

    // The exhaust stack (and its smoke) above it
    get overflow(): Overflow {
        return { top: 50 };
    }

    get tagPrefix(): string {
        return 'DG';
    }

    defaults(): dia.Element.Attributes {
        const fuel = pipePorts(this.stubLength, { left: 'calc(0.6 * h)' })!;
        const power = terminalPorts([{ id: 'out', side: 'right', along: 'calc(0.6 * h)' }])!;
        return {
            ...super.defaults,
            type: 'DieselGenerator',
            // Its label (see `text-from`)
            label: { text: 'Diesel Generator', position: 'bottom' },
            // What it shows (see `data.ts`)
            data: {
                power: 1
            },
            size: {
                width: 200,
                height: 100
            },
            attrs: {
                root: {
                    magnetSelector: 'engine'
                },
                // Shown while it runs (see `animations.ts`)
                smoke: {
                    fill: 'var(--shape-smoke)',
                    opacity: 0
                },
                smoke1: { cx: 'calc(0.17 * w)', cy: -30, r: 8 },
                smoke2: { cx: 'calc(0.17 * w + 8)', cy: -44, r: 11 },
                exhaust: {
                    x: 'calc(0.17 * w - 6)',
                    y: -22,
                    width: 12,
                    height: 'calc(0.2 * h + 22)',
                    surfaceFill: 'cylinder',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                skid: {
                    // In the accent of its style (see `style-color.ts`)
                    styleFill: 'accent',
                    y: 'calc(h - 12)',
                    width: 'calc(w)',
                    height: 12,
                    rx: 2,
                    ry: 2,
                    fill: 'var(--shape-skid)',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                // From the left edge (the fuel stub) to the alternator
                engine: {
                    y: 'calc(0.2 * h)',
                    width: 'calc(0.54 * w)',
                    height: 'calc(0.68 * h)',
                    rx: 4,
                    ry: 4,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                // The cooling grille of the radiator
                grille: {
                    d: 'M calc(0.08 * w) calc(0.32 * h) H calc(0.26 * w) M calc(0.08 * w) calc(0.44 * h) H calc(0.26 * w) M calc(0.08 * w) calc(0.56 * h) H calc(0.26 * w) M calc(0.08 * w) calc(0.68 * h) H calc(0.26 * w)',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinecap: 'round'
                },
                // To the right edge (the terminal)
                alternator: {
                    x: 'calc(0.54 * w)',
                    y: 'calc(0.28 * h)',
                    width: 'calc(0.46 * w)',
                    height: 'calc(0.6 * h)',
                    rx: 'calc(0.06 * w)',
                    ry: 'calc(0.3 * h)',
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                ribs: {
                    d: 'M calc(0.66 * w) calc(0.3 * h) V calc(0.86 * h) M calc(0.77 * w) calc(0.3 * h) V calc(0.86 * h) M calc(0.88 * w) calc(0.3 * h) V calc(0.86 * h)',
                    surfaceStroke: 'edge',
                    strokeOpacity: 0.5,
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes
                }
            },
            ports: {
                groups: { ...fuel.groups, ...power.groups },
                items: [fuel.items![0], ...power.items!]
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
