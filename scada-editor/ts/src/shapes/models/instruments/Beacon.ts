import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import { Layer, MAX_LIQUID_COLOR } from '../../../const';
import Shape, { type Resizable, type ControlKind } from '../../common/Shape';
import { dataOf } from '../../common/data';

const LAMP_OFF_COLOR = '#9aa3ab';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <circle @selector='glow' />
    <path @selector='lamp' />
    <path @selector='shine' />
    <rect @selector='body' />
    <text @selector='label' />
`;

/** An alarm beacon: the lamp glows while it's on. */
export default class Beacon extends Shape {
    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get rotatable(): boolean {
        return false;
    }

    get control(): ControlKind {
        return 'power';
    }

    get tagPrefix(): string {
        return 'AL';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Beacon',
            // Its label (see `text-from`)
            label: { text: 'Beacon', position: 'bottom' },
            // What it shows (see `data.ts`)
            data: {
                // 0 = off, 1 = on
                power: 0
            },
            size: {
                width: 40,
                height: 50
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                // Around the lamp, over its surroundings (not a part of the footprint of the shape: shown while it's on only)
                glow: {
                    // Computed (see `attrsOf()`)
                    computed: true,
                    cx: 'calc(w / 2)',
                    cy: 'calc(0.4 * w)',
                    r: 'calc(0.9 * w)',
                    fill: MAX_LIQUID_COLOR,
                    fillOpacity: 0.2
                },
                // The dome from the top of the element (its center `0.4 * w` below it)
                lamp: {
                    // Computed (see `attrsOf()`)
                    computed: true,
                    d: 'M calc(0.1 * w) calc(0.7 * h) V calc(0.4 * w) A calc(0.4 * w) calc(0.4 * w) 0 0 1 calc(0.9 * w) calc(0.4 * w) V calc(0.7 * h) Z',
                    stroke: '#333',
                    strokeWidth: 2
                },
                // The reflection on the glass
                shine: {
                    d: 'M calc(0.3 * w) calc(0.6 * h) V calc(0.4 * w) A calc(0.2 * w) calc(0.2 * w) 0 0 1 calc(0.45 * w) calc(0.13 * w)',
                    fill: 'none',
                    stroke: '#fff',
                    strokeOpacity: 0.7,
                    strokeWidth: 3,
                    strokeLinecap: 'round'
                },
                body: {
                    y: 'calc(0.7 * h)',
                    width: 'calc(w)',
                    height: 'calc(0.3 * h)',
                    rx: 3,
                    ry: 3,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'plate'
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

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
    }

    /** The lamp lit and glowing while the alarm is on (see `computed.ts`) */
    attrsOf(selector: string): Record<string, unknown> {
        const on = Boolean(dataOf(this, 'power'));
        if (selector === 'lamp') return { fill: on ? MAX_LIQUID_COLOR : LAMP_OFF_COLOR };
        if (selector === 'glow') return { display: on ? 'block' : 'none' };
        return {};
    }

}
