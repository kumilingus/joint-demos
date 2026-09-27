import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE, plateGradient } from './gradients';
import { Layer, LIQUID_COLOR } from '../const';
import { Shape } from './Shape';

// The margins of the chart in the screen (the screen is 6 inside the bezel)
const CHART_X = 12;
const CHART_Y = 14;

/** A number with an explicit sign, for `calc()`. */
const signed = (value: number) => `${value < 0 ? '-' : '+'} ${Math.abs(Number(value.toFixed(3)))}`;

/** A coordinate at the relative position `ratio` (0 - 1) of the chart, from the `margin` to the size minus it. */
const chartCoordinate = (ratio: number, margin: number, variable: 'w' | 'h') => {
    return `calc(${Number(ratio.toFixed(3))} * ${variable} ${signed(margin - 2 * margin * ratio)})`;
};

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='screen' />
    <path @selector='gridLine' />
    <path @selector='line' />
    <text @selector='label' />
`;

/** A panel showing the recent history of a value (0 - 100): the newest on the right. */
export class Trend extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    get tagPrefix(): string {
        return 'TRD';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Trend',
            size: {
                width: 160,
                height: 80
            },
            // The recent values (0 - 100), the oldest first
            values: [42, 45, 44, 50, 55, 52, 58, 61, 57, 60, 64, 62],
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
                // The middle of the scale
                gridLine: {
                    d: `M ${CHART_X} calc(0.5 * h) H calc(w - ${CHART_X})`,
                    stroke: '#fff',
                    strokeOpacity: 0.15,
                    strokeDasharray: '3,3'
                },
                line: {
                    fill: 'none',
                    stroke: LIQUID_COLOR,
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round'
                },
                label: {
                    ...labelAttributes,
                    text: 'Trend'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateLine();
        this.on('change:values', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateLine(options));
    }

    /** The line through the values, across the whole width of the chart. */
    updateLine(options?: dia.Cell.Options): void {
        const values: number[] = this.get('values') || [];
        const last = Math.max(1, values.length - 1);
        const d = values.map((value, index) => {
            const x = chartCoordinate(index / last, CHART_X, 'w');
            const y = chartCoordinate(1 - Math.max(0, Math.min(100, value)) / 100, CHART_Y, 'h');
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        this.attr('line/d', d || 'M 0 0', options);
    }
}
