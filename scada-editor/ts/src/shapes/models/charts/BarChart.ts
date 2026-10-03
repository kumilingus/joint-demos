import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import { Layer, LIQUID_COLOR } from '../../../const';
import { getScale, GRID, plotArea, plotAttributes, plotY, type Scale, scaleAttributes, scaleMarkup } from '../../common/charts';
import Shape, { type ColorField } from '../../common/Shape';

// The bar takes this part of its slot of the plot
const BAR_WIDTH = 0.6;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='screen' />
    <path @selector='grid' />
    <path @selector='bars' />
    ${scaleMarkup}
    <text @selector='label' />
`;

/** The bars of the values (on the scale) side by side across the plot, as one path */
function barsPath(values: number[], scale: Scale, bbox: dia.BBox): string {
    const plot = plotArea(bbox);
    if (values.length === 0) return 'M 0 0';
    const slot = plot.width / values.length;
    const width = slot * BAR_WIDTH;
    const bottom = plot.y + plot.height;
    return values.map((value, index) => {
        const x = plot.x + slot * index + (slot - width) / 2;
        const y = plotY(plot, value, scale);
        return `M ${x} ${bottom} V ${y} H ${x + width} V ${bottom} Z`;
    }).join(' ');
}

/**
 * A bar chart: a value (`values` from `min` to `max`) of each of the recent periods (the mean steam flow
 * of a period). In the runtime mode the newest period comes on the right (see `simulation.ts`).
 */
export default class BarChart extends Shape {

    // The accent: the bars
    get accentField(): ColorField {
        return { path: ['attrs', 'bars', 'fill'] };
    }

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    get tagPrefix(): string {
        return 'BAR';
    }

    static attributes = {
        ...Shape.attributes,
        // The bars of the values of the model (`chartBars` in the attributes)
        'chart-bars': {
            set(this: dia.ElementView, _value: unknown, refBBox: dia.BBox) {
                return { d: barsPath(this.model.get('values') || [], getScale(this.model), refBBox) };
            }
        },
        ...plotAttributes
    };

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'BarChart',
            size: {
                width: 240,
                height: 140
            },
            // The scale of the values
            min: 0,
            max: 100,
            // The values of the periods, the oldest first
            values: [62, 70, 55, 81, 74, 66, 88, 72],
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
                grid: {
                    chartGrid: GRID,
                    stroke: '#fff',
                    strokeOpacity: 0.12
                },
                bars: {
                    chartBars: true,
                    fill: LIQUID_COLOR,
                    fillOpacity: 0.85
                },
                ...scaleAttributes(),
                label: {
                    ...labelAttributes,
                    text: 'Bar Chart'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
