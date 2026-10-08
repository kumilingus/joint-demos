import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import { bowTieAttributes } from '../../common/valve-body';
import { LIQUID_COLOR } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type Resizable, type ControlKind } from '../Shape';
import { dataOf } from '../../common/data';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <path @selector='stem' />
    <path @selector='body' />
    <rect @selector='coil' />
    <text @selector='coilLabel' />
    <text @selector='label' />
`;

/** An electrically operated valve: the coil on top lights up when the valve is open. */
export default class SolenoidValve extends Shape {
    // The accent: the coil
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['coil', 'fill'] };
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
        return { top: 32 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'SolenoidValve',
            // Its label (see `from-model`)
            label: { text: 'Solenoid Valve', position: 'top' },
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
                    d: 'M calc(w / 2) calc(h / 2) V -8',
                    stroke: '#555',
                    strokeWidth: 3
                },
                body: bowTieAttributes,
                coil: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'accent' },
                    x: 'calc(w / 2 - 15)',
                    y: -32,
                    width: 30,
                    height: 24,
                    rx: 3,
                    ry: 3,
                    fill: 'var(--shape-coil)',
                    stroke: '#222',
                    strokeWidth: 2
                },
                coilLabel: {
                    // Computed (see `getComputedAttrs()`)
                    computed: true,
                    text: 'S',
                    x: 'calc(w / 2)',
                    y: -20,
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold'
                },
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

    /** The coil lit while the valve is open (see `computed.ts`) */
    getComputedAttrs(selector: string): Record<string, unknown> {
        return selector === 'coilLabel' ? { fill: dataOf(this, 'open') ? LIQUID_COLOR : '#bbb' } : {};
    }

}
