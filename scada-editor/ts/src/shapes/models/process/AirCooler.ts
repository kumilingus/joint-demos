import { type dia, util } from '@joint/plus';
import { pipePorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type ColorField, type Resizable, type ControlKind } from '../../common/Shape';

// A small blade of a fan, pointing up from its hub; the other two are rotated copies.
const BLADE = 'M 0 0 C 2 -5 10 -12 4 -17 C -1 -15 -5 -8 0 0 Z';
const BLADES = [0, 120, 240].map(angle => `<path d="${BLADE}" transform="rotate(${angle})" />`).join('');

// The fans above the tube bundle (relative x positions)
const FANS = [0.3, 0.7];

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='legs' />
    <rect @selector='plenum' />
    ${FANS.map((_, index) => /* xml */`
        <circle @selector='fan${index + 1}' />
        <g @selector='fan${index + 1}Hub'>
            <g @selector='fan${index + 1}Blades'>${BLADES}</g>
        </g>
    `).join('')}
    <rect @selector='body' />
    <path @selector='fins' />
    <text @selector='label' />
`;

/**
 * A fin-fan air cooler: the fluid runs through the tube bundle,
 * the fans on top blow air through it (they spin while the cooler is on).
 */
export default class AirCooler extends Shape {

    // The accent: the fan plenum
    get accentField(): ColorField {
        return { path: ['attrs', 'plenum', 'fill'] };
    }

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'power';
    }

    get stubLength(): number {
        return 20;
    }

    get tagPrefix(): string {
        return 'AC';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'AirCooler',
            // What it shows (see `data.ts`)
            data: {
                // 0 = off, 1 = on
                power: 0
            },
            size: {
                width: 160,
                height: 80
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                legs: {
                    d: 'M 12 calc(h) V calc(h + 10) M calc(w - 12) calc(h) V calc(h + 10)',
                    stroke: 'var(--shape-legs)',
                    strokeWidth: 5,
                    strokeLinecap: 'round'
                },
                // The plenum the fans sit in
                plenum: {
                    x: 6,
                    width: 'calc(w - 12)',
                    height: 'calc(0.5 * h)',
                    rx: 4,
                    ry: 4,
                    fill: 'var(--shape-plenum)',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                ...Object.fromEntries(FANS.flatMap((x, index) => [
                    [`fan${index + 1}`, {
                        cx: `calc(${x} * w)`,
                        cy: 'calc(0.25 * h)',
                        r: 18,
                        surfaceFill: 'sphere',
                        surfaceStroke: 'edge',
                        strokeWidth: 2
                    }],
                    [`fan${index + 1}Hub`, { transform: `translate(calc(${x} * w), calc(0.25 * h))` }],
                    [`fan${index + 1}Blades`, { fill: '#555', stroke: '#222', strokeWidth: 1 }]
                ])),
                // The tube bundle with its fins
                body: {
                    y: 'calc(0.5 * h)',
                    width: 'calc(w)',
                    height: 'calc(0.5 * h)',
                    rx: 4,
                    ry: 4,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'pipe'
                },
                fins: {
                    d: Array.from({ length: 13 }, (_, i) => `M calc(${((i + 1) / 14).toFixed(3)} * w) calc(0.5 * h + 3) V calc(h - 3)`).join(' '),
                    surfaceStroke: 'edge',
                    strokeOpacity: 0.6,
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    text: 'Air Cooler',
                    y: 'calc(h + 16)'
                }
            },
            // The fluid runs through the tube bundle (the lower half).
            ports: pipePorts(this.stubLength, { left: 'calc(0.75 * h)', right: 'calc(0.75 * h)' })
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
