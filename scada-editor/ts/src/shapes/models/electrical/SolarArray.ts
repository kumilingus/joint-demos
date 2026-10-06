import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type Resizable } from '../../common/Shape';

// The cells of the panel: 6 columns, 3 rows
const COLUMNS = [1, 2, 3, 4, 5].map(i => `M calc(${i / 6} * w) 4 V calc(0.64 * h)`).join(' ');
const ROWS = [1, 2].map(i => `M 4 calc(${(i / 3 * 0.64).toFixed(4)} * h) H calc(w - 4)`).join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='legs' />
    <rect @selector='panel' />
    <path @selector='cells' />
    <text @selector='label' />
`;

/** A solar array: a source of the power (the sun always shines here). */
export default class SolarArray extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get tagPrefix(): string {
        return 'PV';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'SolarArray',
            // Its label (see `from-model`)
            label: { text: 'Solar Array', position: 'bottom' },
            size: {
                width: 180,
                height: 100
            },
            attrs: {
                root: {
                    magnetSelector: 'panel'
                },
                legs: {
                    d: 'M calc(0.2 * w) calc(0.64 * h) V calc(h) M calc(0.8 * w) calc(0.64 * h) V calc(h) M calc(0.1 * w) calc(h) H calc(0.3 * w) M calc(0.7 * w) calc(h) H calc(0.9 * w)',
                    stroke: '#555',
                    strokeWidth: 5,
                    strokeLinecap: 'round'
                },
                panel: {
                    width: 'calc(w)',
                    height: 'calc(0.64 * h)',
                    rx: 3,
                    ry: 3,
                    fill: '#1e3a5f',
                    surfaceStroke: 'edge',
                    strokeWidth: 3
                },
                cells: {
                    d: `${COLUMNS} ${ROWS}`,
                    stroke: '#7aa2cc',
                    strokeOpacity: 0.7,
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes
                }
            },
            ports: terminalPorts([{ id: 'out', side: 'right', along: 'calc(0.3 * h)' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
