import { type dia, util } from '@joint/plus';
import { METAL_STROKE, pipeGradient } from './gradients';
import { branchPorts, fittingPorts } from './ports';
import { FITTING_STUB_LENGTH } from './Fitting';
import type { Overflow } from './footprint';
import { labelAttributes } from './ports';
import Shape, { type Resizable } from './Shape';

// Where the outlets are along the header (relative to its width)
const OUTLETS = ['calc(0.2 * w)', 'calc(0.5 * w)', 'calc(0.8 * w)'];

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <text @selector='label' />
`;

/** A distribution header: one inlet on the left, the outlets below it. */
export default class Manifold extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get stubLength(): number {
        return FITTING_STUB_LENGTH;
    }

    // The outlets go down out of the bounding box, the label is above it (the pipes leave below).
    get overflow(): Overflow {
        return { top: 30, bottom: FITTING_STUB_LENGTH };
    }

    get tagPrefix(): string {
        return 'HDR';
    }

    defaults(): dia.Element.Attributes {
        const inlet = fittingPorts(['left'], FITTING_STUB_LENGTH)!;
        const outlets = branchPorts(OUTLETS, FITTING_STUB_LENGTH)!;
        return {
            ...super.defaults,
            type: 'Manifold',
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
                    rx: 12,
                    ry: 12,
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: pipeGradient
                },
                label: {
                    ...labelAttributes,
                    text: 'Manifold',
                    y: -10,
                    textVerticalAnchor: 'bottom'
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
