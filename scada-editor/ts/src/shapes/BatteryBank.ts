import { type dia, util } from '@joint/plus';
import { terminalPorts } from './ports';
import { labelAttributes } from './attributes/label';
import { LIQUID_COLOR } from '../const';
import Shape, { type ColorField, type Resizable } from './Shape';

// The cells in the cabinet: 2 rows of 5
const cells = Array.from({ length: 10 }, (_, i) => ({ column: i % 5, row: Math.floor(i / 5) }));
const cellX = (column: number) => `calc(${(0.06 + column * 0.18).toFixed(3)} * w)`;
const cellY = (row: number) => `calc(${(0.08 + row * 0.34).toFixed(3)} * h)`;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    ${cells.map((_, i) => `<rect @selector='cell${i}' /><rect @selector='pole${i}' />`).join('')}
    <rect @selector='gauge' />
    <rect @selector='charge' />
    <text @selector='label' />
`;

// The gauge of the charge at the bottom, from the left: its padding
const GAUGE_PADDING = 10;

/** A battery bank (a UPS, a storage of the energy): a source of the power, its charge on a gauge. */
export default class BatteryBank extends Shape {

    // The accent: the bar of the charge
    get accentField(): ColorField {
        return { path: ['attrs', 'charge', 'fill'] };
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get tagPrefix(): string {
        return 'BESS';
    }

    defaults(): dia.Element.Attributes {
        const attrs: Record<string, object> = {};
        cells.forEach(({ column, row }, i) => {
            attrs[`cell${i}`] = { x: cellX(column), y: cellY(row), width: 'calc(0.14 * w)', height: 'calc(0.26 * h)', rx: 2, ry: 2, surfaceFill: 'flat', surfaceStroke: 'edge', strokeWidth: 1.5 };
            attrs[`pole${i}`] = { x: `calc(${(0.06 + column * 0.18 + 0.05).toFixed(3)} * w)`, y: cellY(row), width: 'calc(0.04 * w)', height: 4, fill: '#555' };
        });
        return {
            ...super.defaults,
            type: 'BatteryBank',
            size: {
                width: 160,
                height: 100
            },
            // The charge (0 - 100)
            level: 80,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 4,
                    ry: 4,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 3
                },
                ...attrs,
                gauge: {
                    x: GAUGE_PADDING,
                    y: 'calc(0.8 * h)',
                    width: `calc(w - ${2 * GAUGE_PADDING})`,
                    height: 'calc(0.12 * h)',
                    rx: 3,
                    ry: 3,
                    fill: '#1e272e'
                },
                charge: {
                    x: GAUGE_PADDING,
                    y: 'calc(0.8 * h)',
                    height: 'calc(0.12 * h)',
                    rx: 3,
                    ry: 3,
                    fill: LIQUID_COLOR
                },
                label: {
                    ...labelAttributes,
                    text: 'Battery Bank'
                }
            },
            ports: terminalPorts([{ id: 'out', side: 'right', along: 'calc(0.4 * h)' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateCharge();
        this.on('change:level', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateCharge(options));
    }

    /** The bar of the gauge as long as the charge */
    updateCharge(options?: dia.Cell.Options): void {
        const ratio = Math.max(0, Math.min(100, Number(this.get('level')) || 0)) / 100;
        this.attr('charge/width', `calc(${ratio} * w - ${2 * GAUGE_PADDING * ratio})`, options);
    }
}
