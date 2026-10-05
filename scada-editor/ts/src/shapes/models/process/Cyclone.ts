import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape from '../../common/Shape';
import type { Flip } from '../../attributes/flip';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <g @group-selector='directional'>
        <rect @selector='inlet' />
    </g>
    <rect @selector='outlet' />
    <path @selector='cone' />
    <rect @selector='body' />
    <rect @selector='dustOutlet' />
    <text @selector='label' />
`;

/** A cyclone separator: the dust spins down the cone, the clean gas leaves through the top. */
export default class Cyclone extends Shape {

    // Mirrored horizontally (see `flip.ts`): facing the other way
    get flippable(): Flip {
        return 'x';
    }

    get overflow(): Overflow {
        return { top: 18, left: 24 };
    }

    get tagPrefix(): string {
        return 'CY';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Cyclone',
            // Its label (see `text-from`)
            label: { text: 'Cyclone' },
            size: {
                width: 80,
                height: 160
            },
            attrs: {
                // The parts showing which way it faces: mirrored when it is flipped (see `flip.ts`)
                directional: {
                    flip: true
                },
                root: {
                    magnetSelector: 'body'
                },
                // The tangential inlet on the top left
                inlet: {
                    x: -24,
                    y: 8,
                    width: 30,
                    height: 20,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'pipe'
                },
                outlet: {
                    x: 'calc(0.3 * w)',
                    y: -18,
                    width: 'calc(0.4 * w)',
                    height: 22,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'cylinder'
                },
                cone: {
                    d: 'M 0 calc(0.4 * h) H calc(w) L calc(0.6 * w) calc(h - 10) H calc(0.4 * w) Z',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    surfaceFill: 'cone'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(0.4 * h)',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'cylinder'
                },
                dustOutlet: {
                    x: 'calc(0.4 * w)',
                    y: 'calc(h - 12)',
                    width: 'calc(0.2 * w)',
                    height: 12,
                    surfaceFill: 'mid',
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
