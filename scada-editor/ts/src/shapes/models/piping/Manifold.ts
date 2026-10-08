import { type dia, util } from '@joint/plus';
import { branchPorts, fittingPorts } from '../../common/ports';
import { FITTING_STUB_LENGTH } from './Fitting';
import { labelAttributes } from '../../attributes/label';
import Shape, { type Resizable } from '../Shape';
import type { Flip } from '../../attributes/flip';

// The rounded ends of the header
const BODY_RADIUS = 12;

// Where the outlets are along the header (relative to its width)
const OUTLETS = [0.25, 0.5, 0.75];

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <text @selector='label' />
`;

/** A distribution header: one inlet on the left, the outlets below it. */
export default class Manifold extends Shape {

    // Its inlet on the other end, its outlets up (see `flip.ts`: its ports mirrored)
    get flippable(): Flip {
        return 'xy';
    }

    get resizable(): Resizable {
        return false;
    }

    get stubLength(): number {
        return FITTING_STUB_LENGTH;
    }


    get tagPrefix(): string {
        return 'HDR';
    }

    defaults(): dia.Element.Attributes {
        // The inlet under the rounded end of the header (no gap at its corners)
        const inlet = fittingPorts(['left'], FITTING_STUB_LENGTH, BODY_RADIUS)!;
        const outlets = branchPorts(OUTLETS, FITTING_STUB_LENGTH)!;
        return {
            ...super.defaults,
            type: 'Manifold',
            // Its label (see `from-model`)
            label: { text: 'Manifold', position: 'top' },
            size: {
                width: 160,
                height: 40
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: BODY_RADIUS,
                    ry: BODY_RADIUS,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'pipe'
                },
                // Above it (the pipes leave below): clear of its stubs on any side (flipped: the outlets up)
                label: {
                    ...labelAttributes
                }
            },
            ports: {
                groups: { ...inlet.groups, ...outlets.groups },
                items: [...(inlet.items || []), ...(outlets.items || [])]
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
