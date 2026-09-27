import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE } from './gradients';
import { Layer, MAX_LIQUID_COLOR } from '../const';
import type { Overflow } from './footprint';
import { Shape } from './Shape';

// The scale on the right of the tube (relative heights)
const TICKS = Array.from({ length: 6 }, (_, i) => {
    const y = (0.08 + i * 0.12).toFixed(2);
    return `M calc(w + 2) calc(${y} * h) h ${i % 2 === 0 ? 8 : 5}`;
}).join(' ');

/** A liquid-in-glass thermometer showing a temperature from 0 to 100 %. */
export class Thermometer extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    get overflow(): Overflow {
        return { right: 10, bottom: 34, left: 6 };
    }

    get tagPrefix(): string {
        return 'TI';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Thermometer',
            size: {
                width: 20,
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
                    rx: 'calc(w / 2)',
                    ry: 'calc(w / 2)',
                    fill: '#fff',
                    stroke: METAL_STROKE,
                    strokeWidth: 2
                },
                bulb: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h - 8)',
                    r: 'calc(0.75 * w)',
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
                    stroke: '#333',
                    strokeWidth: 1.5
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
        this.markup = util.svg/* xml */`
            <rect @selector='body' />
            <rect @selector='column' />
            <circle @selector='bulb' />
            <path @selector='ticks' />
            <text @selector='label' />
        `;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateColumn();
        this.on('change:value', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateColumn(options));
    }

    /** The column rises from the bulb to the value on the scale (the scale spans 8% to 68% of the height). */
    updateColumn(options?: dia.Cell.Options): void {
        const value = Math.max(0, Math.min(100, this.get('value') || 0));
        const top = (0.68 - value / 100 * 0.6).toFixed(3);
        this.attr('column', {
            y: `calc(${top} * h)`,
            height: `calc(${(0.95 - Number(top)).toFixed(3)} * h - 8)`
        }, options);
    }
}
