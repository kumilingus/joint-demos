import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type Resizable } from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <g @group-selector='directional'>
        <path @selector='body' />
        <path @selector='inlet' />
        <path @selector='arrow' />
    </g>
    <text @selector='label' />
`;

/** A valve letting the liquid flow in one direction only (from left to right; flipped: from right to left). */
export default class CheckValve extends Shape {

    // The flow the other way, the arrow still above it (see `flip.ts`)
    get flippable(): Flip {
        return 'x';
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 14 };
    }

    get tagPrefix(): string {
        return 'NRV';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'CheckValve',
            // Its label (see `text-from`)
            label: { text: 'Check Valve', position: 'bottom' },
            size: {
                width: 60,
                height: 40
            },
            attrs: {
                pipe: pipeThroughAttributes(),
                root: {
                    magnetSelector: 'body'
                },
                // The parts showing which way it faces: mirrored when it is flipped (see `flip.ts`)
                directional: {
                    flip: true
                },
                // The bow tie of a valve...
                body: {
                    d: 'M 0 0 L calc(w) calc(h) V 0 L 0 calc(h) Z',
                    fill: 'var(--shape-face)',
                    stroke: 'var(--shape-valve-stroke)',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                // ...with the inlet half filled.
                inlet: {
                    d: 'M 0 0 L calc(0.5 * w) calc(0.5 * h) L 0 calc(h) Z',
                    fill: 'var(--shape-valve-inlet)'
                },
                arrow: {
                    d: 'M calc(0.2 * w) -10 H calc(0.8 * w) m -6 -4 l 6 4 l -6 4',
                    fill: 'none',
                    stroke: 'var(--shape-scale)',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round'
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
