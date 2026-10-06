import { type dia, util } from '@joint/plus';
import { pipePorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type ControlKind } from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

// The stages of blades, growing with the casing (relative x positions)
const BLADES = [0.25, 0.45, 0.65, 0.85]
    .map(x => {
        // At the relative x, the casing spans from 0.3 * (1 - x) * h to (1 - 0.3 * (1 - x)) * h.
        const top = (0.3 * (1 - x)).toFixed(3);
        const bottom = (1 - 0.3 * (1 - x)).toFixed(3);
        return `M calc(${x} * w) calc(${top} * h + 6) V calc(${bottom} * h - 6)`;
    })
    .join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <g @group-selector='directional'>
        <path @selector='shaft' />
        <path @selector='body' />
        <path @selector='blades' />
        <path @selector='steam' />
    </g>
    <text @selector='label' />
`;

/** A steam turbine: the casing widens as the steam expands from the left to the right. */
export default class Turbine extends Shape {

    // Mirrored horizontally (see `flip.ts`): facing the other way
    get flippable(): Flip {
        return 'x';
    }

    get control(): ControlKind {
        return 'power';
    }

    get stubLength(): number {
        return 30;
    }

    get tagPrefix(): string {
        return 'TB';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Turbine',
            // Its label (see `from-model`)
            label: { text: 'Turbine', position: 'bottom' },
            // What it shows (see `data.ts`)
            data: {
                // 0 = off, 1 = on
                power: 0
            },
            size: {
                width: 120,
                height: 80
            },
            attrs: {
                // The parts showing which way it faces: mirrored when it is flipped (see `flip.ts`)
                directional: {
                    flip: true
                },
                root: {
                    magnetSelector: 'body'
                },
                shaft: {
                    d: 'M -16 calc(h / 2) H calc(w + 16)',
                    stroke: '#555',
                    strokeWidth: 8
                },
                body: {
                    d: 'M 0 calc(0.3 * h) L calc(w) 0 V calc(h) L 0 calc(0.7 * h) Z',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    surfaceFill: 'pipe'
                },
                blades: {
                    d: BLADES,
                    stroke: '#444',
                    strokeWidth: 3,
                    strokeLinecap: 'round'
                },
                // The steam passing through: streaming from the left to the right while it runs (see `animations.ts`)
                steam: {
                    d: 'M 6 calc(0.42 * h) H calc(w - 6) M 6 calc(0.58 * h) H calc(w - 6)',
                    fill: 'none',
                    stroke: '#fff',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                    strokeDasharray: '6 10',
                    strokeOpacity: 0
                },
                label: {
                    ...labelAttributes
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
