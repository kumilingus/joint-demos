import { type dia, util } from '@joint/plus';
import { pipePorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import { Layer, LIQUID_COLOR, SURFACE_INK } from '../../../const';
import Shape, { type ColorField } from '../../common/Shape';
import { dataOf } from '../../common/data';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='screen' />
    <text @selector='value' />
    <text @selector='unit' />
    <text @selector='label' />
`;

/** An inline flow meter with a display of the current flow. */
export default class FlowMeter extends Shape {

    // The accent: the reading
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['value', 'fill'] };
    }

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    get stubLength(): number {
        return 20;
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'FlowMeter',
            // Its label (see `text-from`)
            label: { text: 'Flow Meter' },
            unit: 'm³/h',
            // What it shows (see `data.ts`): the reading
            data: {
                value: 12.5
            },
            size: {
                width: 80,
                height: 60
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 6,
                    ry: 6,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'plate'
                },
                screen: {
                    x: 6,
                    y: 6,
                    width: 'calc(w - 12)',
                    // The screen takes the top 72% (the unit is below it): 30 of the default 50.
                    height: 'calc(0.72 * h - 6)',
                    rx: 3,
                    ry: 3,
                    fill: '#1e272e',
                    stroke: '#111',
                    strokeWidth: 1
                },
                // The texts grow with the height of the meter.
                // The value is in the middle of the screen (from 6 to 0.72 * h).
                value: {
                    // In the accent of its style (see `style-color.ts`)
                    styleFill: 'accent',
                    // Computed (see `attrsOf()`)
                    computed: true,
                    x: 'calc(w / 2)',
                    y: 'calc(0.36 * h + 3)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 'calc(0.4 * h)',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    fill: LIQUID_COLOR
                },
                unit: {
                    // The text of the model (see `text-from`)
                    textFrom: ['unit'],
                    x: 'calc(w / 2)',
                    // In the middle of the strip below the screen
                    y: 'calc(0.86 * h)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 'calc(0.22 * h)',
                    fontFamily: 'sans-serif',
                    fill: SURFACE_INK
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

    /** The reading with one decimal (see `computed.ts`) */
    attrsOf(selector: string): Record<string, unknown> {
        return selector === 'value' ? { text: (Number(dataOf(this, 'value')) || 0).toFixed(1) } : {};
    }

}
