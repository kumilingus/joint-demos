import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE } from './gradients';
import { LABEL_COLOR, Layer, MAX_LIQUID_COLOR } from '../const';
import type { Overflow } from './footprint';
import { type Resizable, Shape } from './Shape';

// The width of the tube
const WIDTH = 20;

// The scale on the right of the tube (relative heights)
const TICKS = Array.from({ length: 6 }, (_, i) => {
    const y = (0.08 + i * 0.12).toFixed(2);
    return `M calc(w + 2) calc(${y} * h) h ${i % 2 === 0 ? 8 : 5}`;
}).join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='column' />
    <circle @selector='bulb' />
    <path @selector='ticks' />
    <text @selector='reading' />
    <text @selector='label' />
`;

/** A liquid-in-glass thermometer showing a temperature from 0 to 100 %. */
export class Thermometer extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    // Taller or shorter only (a wider tube would blow up the bulb)
    get resizable(): Resizable {
        return { minWidth: WIDTH, maxWidth: WIDTH };
    }

    // The scale and the reading on the right
    get overflow(): Overflow {
        return { right: 56, bottom: 34, left: 6 };
    }

    get tagPrefix(): string {
        return 'TI';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Thermometer',
            size: {
                width: WIDTH,
                height: 120
            },
            // The height of the column in % of the scale
            value: 60,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h - 10)',
                    // Round ends and the bulb by the shorter side (`s`): round in any size
                    rx: 'calc(s / 2)',
                    ry: 'calc(s / 2)',
                    fill: 'var(--shape-face)',
                    stroke: 'var(--shape-thermometer-stroke)',
                    strokeWidth: 2
                },
                bulb: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h - 8)',
                    r: 'calc(0.75 * s)',
                    fill: MAX_LIQUID_COLOR,
                    stroke: METAL_STROKE,
                    strokeWidth: 2
                },
                column: {
                    x: 'calc(w / 2 - 4)',
                    width: 8,
                    fill: MAX_LIQUID_COLOR
                },
                ticks: {
                    d: TICKS,
                    stroke: 'var(--shape-scale)',
                    strokeWidth: 1.5
                },
                // The temperature, next to the top of the column (see `updateColumn()`)
                reading: {
                    x: 'calc(w + 14)',
                    textVerticalAnchor: 'middle',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fontWeight: 600,
                    fill: LABEL_COLOR
                },
                label: {
                    ...labelAttributes,
                    text: 'Thermometer',
                    y: 'calc(h + 16)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateColumn();
        this.on('change:value', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateColumn(options));
    }

    /**
     * The column rises from the bulb to the value on the scale (the scale spans 8% to 68% of the height),
     * the reading (in °C, the scale is 0 - 100 °C) is next to its top.
     */
    updateColumn(options?: dia.Cell.Options): void {
        const value = Math.max(0, Math.min(100, this.get('value') || 0));
        const top = (0.68 - value / 100 * 0.6).toFixed(3);
        this.attr({
            column: {
                y: `calc(${top} * h)`,
                height: `calc(${(0.95 - Number(top)).toFixed(3)} * h - 8)`
            },
            reading: {
                y: `calc(${top} * h)`,
                text: `${Math.round(value)} °C`
            }
        }, options);
    }
}
