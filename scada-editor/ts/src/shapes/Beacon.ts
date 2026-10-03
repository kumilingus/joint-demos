import { type dia, util } from '@joint/plus';
import { labelAttributes } from './attributes/label';
import { Layer, MAX_LIQUID_COLOR } from '../const';
import type { Overflow } from './footprint';
import Shape, { type Resizable, type ControlKind } from './Shape';

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

    get overflow(): Overflow {
        return { top: 12, right: 16, left: 16 };
    }

    get tagPrefix(): string {
        return 'AL';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Beacon',
            size: {
                width: 40,
                height: 60
            },
            // 0 = off, 1 = on
            power: 0,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                glow: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(0.4 * h)',
                    r: 'calc(0.9 * w)',
                    fill: MAX_LIQUID_COLOR,
                    fillOpacity: 0.2
                },
                lamp: {
                    d: 'M calc(0.1 * w) calc(0.7 * h) V calc(0.4 * h) A calc(0.4 * w) calc(0.4 * w) 0 0 1 calc(0.9 * w) calc(0.4 * h) V calc(0.7 * h) Z',
                    stroke: '#333',
                    strokeWidth: 2
                },
                // The reflection on the glass
                shine: {
                    d: 'M calc(0.3 * w) calc(0.6 * h) V calc(0.4 * h) A calc(0.2 * w) calc(0.2 * w) 0 0 1 calc(0.45 * w) calc(0.22 * h)',
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
                    ...labelAttributes,
                    text: 'Beacon'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateLamp();
        this.on('change:power', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateLamp(options));
    }

    updateLamp(options?: dia.Cell.Options): void {
        const on = Boolean(this.get('power'));
        this.attr({
            lamp: { fill: on ? MAX_LIQUID_COLOR : LAMP_OFF_COLOR },
            glow: { display: on ? 'block' : 'none' }
        }, options);
    }
}
