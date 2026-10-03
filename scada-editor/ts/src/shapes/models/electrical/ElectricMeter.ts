import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import { Layer, LIQUID_COLOR } from '../../../const';
import Shape, { type ColorField, type Resizable } from '../../common/Shape';

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

    // The accent: the reading (its unit in the same color)
    get accentField(): ColorField {
        return { path: ['attrs', 'value', 'fill'] };
    }

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
                    fillFrom: ['value', 'fill'],
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
