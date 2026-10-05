import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import { bowTieAttributes, leverAttributes } from '../../common/valve-body';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type Resizable, type ControlKind } from '../../common/Shape';
import { dataOf } from '../../common/data';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <path @selector='lever' />
    <path @selector='body' />
    <path @selector='disc' />
    <circle @selector='pivot' />
    <text @selector='label' />
`;

/** A quarter-turn valve with a disc: along the flow when open, across it when closed. */
export default class ButterflyValve extends Shape {
    // The accent: the pivot
    get accentField(): ColorField {
        return { path: ['attrs', 'pivot', 'fill'] };
    }

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'toggle';
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 17 };
    }

    get tagPrefix(): string {
        return 'BFV';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'ButterflyValve',
            // What it shows (see `data.ts`)
            data: {
                open: true
            },
            size: {
                width: 60,
                height: 40
            },
            attrs: {
                pipe: pipeThroughAttributes(),
                root: {
                    magnetSelector: 'body'
                },
                lever: leverAttributes,
                body: bowTieAttributes,
                disc: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    d: 'M 0 -16 V 16',
                    stroke: '#333',
                    strokeWidth: 5,
                    strokeLinecap: 'round'
                },
                pivot: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 4,
                    fill: 'var(--shape-pivot)'
                },
                label: {
                    ...labelAttributes,
                    // Above it: its control below (see `controlPosition` in `controls.ts`)
                    labelPosition: 'top',
                    text: 'Butterfly Valve'
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
    }

    /** The disc along the flow (open) or across it (closed), see `from-data.ts` */
    dataAttributes(selector: string): Record<string, unknown> {
        if (selector !== 'disc') return {};
        const angle = dataOf(this, 'open') ? 90 : 0;
        return { transform: `translate(calc(w / 2), calc(h / 2)) rotate(${angle})` };
    }

}
