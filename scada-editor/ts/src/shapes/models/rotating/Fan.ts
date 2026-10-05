import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type Resizable, type ControlKind } from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

// One blade pointing up from the hub; the other two are rotated copies.
const BLADE = 'M 0 0 C 4 -8 16 -20 6 -30 C -2 -26 -8 -14 0 0 Z';

const blade = (angle: number) => ({
    d: BLADE,
    transform: `translate(calc(w / 2), calc(h / 2)) rotate(${angle})`
});

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <circle @selector='body' />
    <circle @selector='guard' />
    <g @group-selector='directional'>
        <g @selector='blades'>
            <path @selector='blade1' />
            <path @selector='blade2' />
            <path @selector='blade3' />
        </g>
    </g>
    <circle @selector='hub' />
    <text @selector='label' />
`;

export default class Fan extends Shape {

    // Mirrored horizontally (see `flip.ts`): facing the other way
    get flippable(): Flip {
        return 'x';
    }

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'power';
    }

    get stubLength(): number {
        return 30;
    }

    get tagPrefix(): string {
        return 'FN';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Fan',
            size: {
                width: 100,
                height: 100
            },
            // 0 = off, 1 = on
            power: 0,
            attrs: {
                pipe: pipeThroughAttributes(),
                // The parts showing which way it faces: mirrored when it is flipped (see `flip.ts`)
                directional: {
                    flip: ''
                },
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 'calc(0.45 * w)',
                    surfaceFill: 'flat',
                    stroke: '#666',
                    strokeWidth: 2
                },
                guard: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 34,
                    surfaceFill: 'mid',
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 1
                },
                blades: {
                    fill: '#bbb',
                    stroke: '#222',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                blade1: blade(0),
                blade2: blade(120),
                blade3: blade(240),
                hub: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 5,
                    fill: '#333'
                },
                label: {
                    ...labelAttributes,
                    text: 'Fan'
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
