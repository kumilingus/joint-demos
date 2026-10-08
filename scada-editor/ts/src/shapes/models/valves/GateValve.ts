import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import { bowTieAttributes } from '../../common/valve-body';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type Resizable, type ControlKind } from '../Shape';
import { dataOf } from '../../common/data';

// How high the handwheel is above the valve: the stem rises when the valve opens.
const HANDWHEEL_OPEN = -36;
const HANDWHEEL_CLOSED = -16;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <path @selector='stem' />
    <rect @selector='yoke' />
    <rect @selector='handwheel' />
    <path @selector='body' />
    <text @selector='label' />
`;

/** A gate valve with a rising stem: the handwheel is up while the valve is open. */
export default class GateValve extends Shape {
    // The accent: the handwheel
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['handwheel', 'fill'] };
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get control(): ControlKind {
        return 'toggle';
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 44 };
    }

    get tagPrefix(): string {
        return 'GV';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'GateValve',
            // Its label (see `from-model`)
            label: { text: 'Gate Valve', position: 'top' },
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
                stem: {
                    // Computed (see `getComputedAttrs()`)
                    computed: true,
                    stroke: '#555',
                    strokeWidth: 4
                },
                yoke: {
                    x: 'calc(w / 2 - 8)',
                    y: -8,
                    width: 16,
                    height: 10,
                    surfaceFill: 'mid',
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 1.5
                },
                handwheel: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'accent' },
                    // Computed (see `getComputedAttrs()`)
                    computed: true,
                    x: 'calc(w / 2 - 20)',
                    width: 40,
                    height: 8,
                    rx: 4,
                    ry: 4,
                    fill: 'var(--shape-valve-operator)',
                    stroke: '#333',
                    strokeWidth: 2
                },
                body: bowTieAttributes,
                label: {
                    ...labelAttributes,
                    // Above it: its control below (see `controlPosition` in `controls.ts`)
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

    /** The stem and the handwheel up (open) or down (closed), see `computed.ts` */
    getComputedAttrs(selector: string): Record<string, unknown> {
        const top = dataOf(this, 'open') ? HANDWHEEL_OPEN : HANDWHEEL_CLOSED;
        if (selector === 'stem') return { d: `M calc(w / 2) calc(h / 2) V ${top}` };
        if (selector === 'handwheel') return { y: top - 4 };
        return {};
    }

}
