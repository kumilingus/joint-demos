import { type dia, util } from '@joint/plus';
import { pipePorts, STUB_THICKNESS } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type ColorField, type Resizable } from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <g @group-selector='directional'>
        <path @selector='leg' />
        <path @selector='screen' />
        <rect @selector='cap' />
    </g>
    <rect @selector='body' />
    <text @selector='label' />
`;

/** An inline strainer: the dirt is caught by the screen in the leg of the Y. */
export default class YStrainer extends Shape {

    // Its leg mirrored: horizontally (the flow the other way), vertically (the leg up) or both (see `flip.ts`)
    get flippable(): Flip {
        return 'xy';
    }

    // The accent: the cap
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['cap', 'fill'] };
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get stubLength(): number {
        return 20;
    }

    get tagPrefix(): string {
        return 'STR';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'YStrainer',
            // Its label (see `from-model`)
            label: { text: 'Strainer', position: 'bottom' },
            size: {
                width: 80,
                height: 60
            },
            attrs: {
                // The parts showing which way it faces: mirrored when it is flipped (see `flip.ts`)
                directional: {
                    flip: true
                },
                root: {
                    magnetSelector: 'body'
                },
                // The leg of the Y, down to the right
                leg: {
                    d: 'M calc(0.3 * w) calc(0.5 * h) H calc(0.6 * w) L calc(0.85 * w) calc(h - 8) H calc(0.55 * w) Z',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    surfaceFill: 'cylinder'
                },
                screen: {
                    d: 'M calc(0.47 * w) calc(0.55 * h) L calc(0.7 * w) calc(h - 12)',
                    stroke: '#333',
                    strokeWidth: 2,
                    strokeDasharray: '3,2'
                },
                cap: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'accent' },
                    x: 'calc(0.52 * w)',
                    y: 'calc(h - 10)',
                    width: 'calc(0.36 * w)',
                    height: 10,
                    rx: 2,
                    ry: 2,
                    fill: 'var(--shape-cap)',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                // As thick as its pipe stubs (see `ports.ts`)
                body: {
                    y: `calc(0.5 * h - ${STUB_THICKNESS / 2})`,
                    width: 'calc(w)',
                    height: STUB_THICKNESS,
                    rx: 6,
                    ry: 6,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'pipe'
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
