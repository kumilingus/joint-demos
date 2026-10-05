import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type Resizable } from '../../common/Shape';

// The columns of the radiator
const COLUMNS = [0.14, 0.3, 0.46, 0.62, 0.78];

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <path @selector='columns' />
    <rect @selector='grille' />
    <path @selector='coil' />
    <path @selector='feet' />
    <text @selector='label' />
`;

/** An electric heater: a panel radiator, a load; its heating element glows while it is energized (see `ElectricalController`). */
export default class Heater extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get tagPrefix(): string {
        return 'HTR';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Heater',
            // Its label (see `text-from`)
            label: { text: 'Heater' },
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
                    height: 'calc(0.9 * h)',
                    rx: 5,
                    ry: 5,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                columns: {
                    d: COLUMNS.map(x => `M calc(${x} * w) 6 V calc(0.9 * h - 6)`).join(' '),
                    surfaceStroke: 'edge',
                    strokeOpacity: 0.45,
                    strokeWidth: 6,
                    strokeLinecap: 'round'
                },
                // The window of the heating element at the bottom
                grille: {
                    x: 'calc(0.1 * w)',
                    y: 'calc(0.6 * h)',
                    width: 'calc(0.8 * w)',
                    height: 'calc(0.2 * h)',
                    rx: 3,
                    ry: 3,
                    fill: '#2b2f33'
                },
                coil: {
                    d: 'M calc(0.14 * w) calc(0.7 * h) q calc(0.04 * w) -5 calc(0.08 * w) 0 t calc(0.08 * w) 0 t calc(0.08 * w) 0 t calc(0.08 * w) 0 t calc(0.08 * w) 0 t calc(0.08 * w) 0 t calc(0.08 * w) 0 t calc(0.08 * w) 0 t calc(0.08 * w) 0',
                    fill: 'none',
                    stroke: '#6b7075',
                    strokeWidth: 2.5,
                    strokeLinecap: 'round'
                },
                feet: {
                    d: 'M calc(0.15 * w) calc(0.9 * h) V calc(h) M calc(0.85 * w) calc(0.9 * h) V calc(h)',
                    stroke: '#555',
                    strokeWidth: 5,
                    strokeLinecap: 'round'
                },
                label: {
                    ...labelAttributes
                }
            },
            ports: terminalPorts([{ id: 'in', side: 'top' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
