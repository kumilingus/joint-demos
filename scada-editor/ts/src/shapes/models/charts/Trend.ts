import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import { Layer, LIQUID_COLOR } from '../../../const';
import Shape, { type ColorField } from '../../common/Shape';
import { dataOf } from '../../common/data';

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
export default class Trend extends Shape {
    // The accent: the line
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['line', 'stroke'] };
    }

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
            // Its label (see `from-model`)
            label: { text: 'Trend', position: 'bottom' },
            // What it shows (see `data.ts`)
            data: {
                // The recent values (0 - 100), the oldest first
                values: [42, 45, 44, 50, 55, 52, 58, 61, 57, 60, 64, 62]
            },
            size: {
                width: 160,
                height: 80
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
                // The middle of the scale
                gridLine: {
                    d: `M ${CHART_X} calc(0.5 * h) H calc(w - ${CHART_X})`,
                    stroke: '#fff',
                    strokeOpacity: 0.15,
                    strokeDasharray: '3,3'
                },
                line: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { stroke: 'accent' },
                    // Computed (see `attrsOf()`)
                    computed: true,
                    fill: 'none',
                    stroke: LIQUID_COLOR,
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round'
                },
                label: {
                    ...labelAttributes
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
    }

    /** The line through the values, across the whole width of the chart (see `computed.ts`) */
    attrsOf(selector: string): Record<string, unknown> {
        if (selector !== 'line') return {};
        const values = dataOf<number[]>(this, 'values') || [];
        const last = Math.max(1, values.length - 1);
        const d = values.map((value, index) => {
            const x = chartCoordinate(index / last, CHART_X, 'w');
            const y = chartCoordinate(1 - Math.max(0, Math.min(100, value)) / 100, CHART_Y, 'h');
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        return { d: d || 'M 0 0' };
    }

}
