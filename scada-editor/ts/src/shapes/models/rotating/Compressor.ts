import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type ColorField, type Resizable, type ControlKind } from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <g @group-selector='directional'>
        <path @selector='base' />
        <circle @selector='body' />
        <circle @selector='rotor' />
        <path @selector='symbol' />
    </g>
    <text @selector='label' />
`;

export default class Compressor extends Shape {

    // Mirrored horizontally (see `flip.ts`): facing the other way
    get flippable(): Flip {
        return 'x';
    }

    // The accent: the base
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['base', 'fill'] };
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get control(): ControlKind {
        return 'power';
    }

    get stubLength(): number {
        return 30;
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Compressor',
            // Its label (see `text-from`)
            label: { text: 'Compressor', position: 'bottom' },
            // What it shows (see `data.ts`)
            data: {
                // 0 = off, 1 = on
                power: 0
            },
            size: {
                width: 80,
                height: 80
            },
            attrs: {
                pipe: pipeThroughAttributes(),
                // The parts showing which way it faces: mirrored when it is flipped (see `flip.ts`)
                directional: {
                    flip: true
                },
                root: {
                    magnetSelector: 'body'
                },
                base: {
                    // In the accent of its style (see `style-color.ts`)
                    styleFill: 'accent',
                    d: 'M calc(0.15 * w) calc(h) L calc(0.3 * w) calc(0.8 * h) H calc(0.7 * w) L calc(0.85 * w) calc(h) Z',
                    fill: 'var(--shape-support)',
                    stroke: '#333',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 'calc(0.45 * w)',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'sphere'
                },
                // The rotor: a dashed ring turning around the symbol while it runs (see `animations.ts`), hidden otherwise
                rotor: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 'calc(0.38 * w)',
                    fill: 'none',
                    stroke: '#333',
                    strokeWidth: 2,
                    strokeDasharray: '4 6',
                    strokeOpacity: 0
                },
                // The ISA symbol of a compressor: a trapezoid narrowing in the direction of the flow.
                symbol: {
                    d: 'M calc(0.22 * w) calc(0.22 * h) L calc(0.78 * w) calc(0.36 * h) V calc(0.64 * h) L calc(0.22 * w) calc(0.78 * h) Z',
                    fill: '#777',
                    stroke: '#222',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
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
