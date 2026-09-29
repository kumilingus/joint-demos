import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE, plateGradient } from './gradients';
import { Layer, LIQUID_COLOR, MAX_LIQUID_COLOR, MIN_LIQUID_COLOR } from '../const';
import { CHART_POINTS, getScale, GRID, plotArea, plotAttributes, plotY, type Scale, scaleAttributes, scaleMarkup } from './charts';
import Shape from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='screen' />
    <path @selector='grid' />
    <path @selector='area' />
    <path @selector='line' />
    <path @selector='highMark' />
    <path @selector='lowMark' />
    ${scaleMarkup}
    <text @selector='label' />
`;

/** The line (or the area under it) through the values (on the scale), across the plot */
function seriesPath(values: number[], scale: Scale, bbox: dia.BBox, closed: boolean): string {
    const plot = plotArea(bbox);
    if (values.length === 0) return 'M 0 0';
    const last = Math.max(1, values.length - 1);
    const points = values.map((value, index) => `${plot.x + plot.width * index / last} ${plotY(plot, value, scale)}`);
    const line = `M ${points.join(' L ')}`;
    return closed ? `${line} V ${plot.y + plot.height} H ${plot.x} Z` : line;
}

/**
 * A line chart: the recent history of a value (`values` from `min` to `max`: the newest on the right)
 * with the warning thresholds. In the runtime mode the newest value comes on the right (see `simulation.ts`).
 */
export default class LineChart extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    get tagPrefix(): string {
        return 'TRD';
    }

    static attributes = {
        // The line through the values of the model (`chartSeries` in the attributes: 'line' or 'area')
        'chart-series': {
            set(this: dia.ElementView, kind: 'line' | 'area', refBBox: dia.BBox) {
                return { d: seriesPath(this.model.get('values') || [], getScale(this.model), refBBox, kind === 'area') };
            }
        },
        // A horizontal line at the threshold of the model (`chartLevel` in the attributes: 'low' or 'high')
        'chart-level': {
            set(this: dia.ElementView, which: 'low' | 'high', refBBox: dia.BBox) {
                const value = Number(this.model.prop(['thresholds', which]));
                if (!Number.isFinite(value)) return { d: 'M 0 0' };
                const plot = plotArea(refBBox);
                const y = plotY(plot, value, getScale(this.model));
                return { d: `M ${plot.x} ${y} H ${plot.x + plot.width}` };
            }
        },
        // The grid and the scale
        ...plotAttributes
    };

    defaults(): dia.Element.Attributes {
        const mark = { fill: 'none', strokeWidth: 1.5, strokeDasharray: '4 3' };
        return {
            ...super.defaults,
            type: 'LineChart',
            size: {
                width: 280,
                height: 140
            },
            // The scale of the values
            min: 0,
            max: 100,
            // The recent values, the oldest first
            values: Array.from({ length: CHART_POINTS }, (_, i) => Math.round(50 + 20 * Math.sin(i / 2))),
            // The warning levels (on the scale), dashed lines across the chart
            thresholds: { low: 20, high: 80 },
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
                grid: {
                    chartGrid: GRID,
                    stroke: '#fff',
                    strokeOpacity: 0.12
                },
                area: {
                    chartSeries: 'area',
                    fill: LIQUID_COLOR,
                    fillOpacity: 0.2
                },
                line: {
                    chartSeries: 'line',
                    fill: 'none',
                    stroke: LIQUID_COLOR,
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                highMark: { ...mark, chartLevel: 'high', stroke: MAX_LIQUID_COLOR },
                lowMark: { ...mark, chartLevel: 'low', stroke: MIN_LIQUID_COLOR },
                ...scaleAttributes(),
                label: {
                    ...labelAttributes,
                    text: 'Line Chart'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
