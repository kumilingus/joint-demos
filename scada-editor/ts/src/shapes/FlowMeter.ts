import { type dia, util } from '@joint/plus';
import { centerPortPosition, labelAttributes, pipePorts } from './ports';
import { METAL_STROKE, plateGradient } from './gradients';
import { Layer, LIQUID_COLOR } from '../const';
import Shape from './Shape';

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
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: plateGradient
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
                    text: '12.5',
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
                    text: 'm³/h',
                    x: 'calc(w / 2)',
                    // In the middle of the strip below the screen
                    y: 'calc(0.86 * h)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 'calc(0.22 * h)',
                    fontFamily: 'sans-serif',
                    fill: '#333'
                },
                label: {
                    ...labelAttributes,
                    text: 'Flow Meter'
                }
            },
            ports: pipePorts(centerPortPosition)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
