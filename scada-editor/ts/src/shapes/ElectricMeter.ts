import { type dia, util } from '@joint/plus';
import { labelAttributes, terminalPorts } from './ports';
import { METAL_STROKE, plateGradient } from './gradients';
import { Layer, LIQUID_COLOR } from '../const';
import Shape, { type Resizable } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='screen' />
    <text @selector='value' />
    <text @selector='unit' />
    <text @selector='label' />
`;

/** A meter on a circuit: shows its voltage (from the plant, zero while it is not energized). */
export default class ElectricMeter extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get resizable(): Resizable {
        return false;
    }

    get rotatable(): boolean {
        return false;
    }

    get tagPrefix(): string {
        return 'EI';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'ElectricMeter',
            size: {
                width: 120,
                height: 50
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
                    height: 'calc(h - 12)',
                    rx: 3,
                    ry: 3,
                    fill: '#1e272e',
                    stroke: '#111',
                    strokeWidth: 1
                },
                value: {
                    text: '230.0',
                    x: 'calc(w - 26)',
                    y: 'calc(0.5 * h)',
                    textAnchor: 'end',
                    textVerticalAnchor: 'middle',
                    fontSize: 20,
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    fill: LIQUID_COLOR
                },
                unit: {
                    text: 'V',
                    x: 'calc(w - 12)',
                    y: 'calc(0.5 * h)',
                    textAnchor: 'end',
                    textVerticalAnchor: 'middle',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fill: LIQUID_COLOR
                },
                label: {
                    ...labelAttributes,
                    text: 'Voltmeter'
                }
            },
            ports: terminalPorts([{ id: 'in', side: 'left' }, { id: 'out', side: 'right' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
