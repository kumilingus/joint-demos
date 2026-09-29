import { dia, g, V } from '@joint/plus';

/*
 * What the charts (see `LineChart`, `BarChart`, `DonutChart`, `GaugeChart`) have in common. A chart is
 * a shape: its data is on the model (`values`, `slices`, `value`, the scale `min` and `max`), its paths are computed from the data
 * and the size by its special attributes when it is rendered (not stored in the attributes).
 * Its view renders it again when the data changes (see `chartView()`).
 */

/** The margins of the plot in the screen of a line or a bar chart (the scale on the left) */
const PLOT_MARGIN = { left: 34, right: 14, top: 14, bottom: 14 };

/** The area of the plot in the element (a line or a bar chart) */
export function plotArea(bbox: dia.BBox): g.Rect {
    const { left, right, top, bottom } = PLOT_MARGIN;
    return new g.Rect(bbox.x + left, bbox.y + top, bbox.width - left - right, bbox.height - top - bottom);
}

/** The range of the values shown by a chart (the `min` and the `max` of the model) */
export interface Scale {
    min: number;
    max: number;
}

/** The scale of the chart: a max not above the min (or none) is taken as the min and one more */
export function getScale(model: dia.Cell): Scale {
    const min = Number(model.get('min')) || 0;
    const max = model.get('max') === null ? NaN : Number(model.get('max'));
    return { min, max: Number.isFinite(max) && max > min ? max : min + 1 };
}

/** How far the value is in the scale (0 - 1, clamped) */
export function scaleFraction(scale: Scale, value: number): number {
    return Math.max(0, Math.min(1, (value - scale.min) / (scale.max - scale.min)));
}

/** The vertical position of a value (on the scale) in the plot */
export function plotY(plot: g.Rect, value: number, scale: Scale): number {
    return plot.y + plot.height * (1 - scaleFraction(scale, value));
}

/** A number with an explicit sign, for `calc()` */
const signed = (value: number) => `${value < 0 ? '-' : '+'} ${Math.abs(Number(value.toFixed(3)))}`;

/** The vertical position of a part of the height of the plot (0 - 1) as a `calc()` of the height (for a static attribute) */
export function plotYCalc(fraction: number): string {
    const ratio = 1 - fraction;
    const { top, bottom } = PLOT_MARGIN;
    return `calc(${Number(ratio.toFixed(3))} * h ${signed(top - (top + bottom) * ratio)})`;
}

/** The left edge of the plot (the scale is right-aligned to it) */
export const PLOT_LEFT = PLOT_MARGIN.left;

/** The horizontal lines of the plot at the parts of its height (0 - 1) */
export function gridPath(plot: g.Rect, fractions: number[]): string {
    return fractions.map(fraction => `M ${plot.x} ${plot.y + plot.height * (1 - fraction)} H ${plot.x + plot.width}`).join(' ');
}

/** The parts of the height of the plot with a line of the grid and with a value of the scale */
export const GRID = [0, 0.25, 0.5, 0.75, 1];
export const SCALE = [0, 0.5, 1];

/** A number of the scale: without the decimals unless it needs them */
const formatScale = (value: number) => String(Number(value.toFixed(Math.abs(value) < 10 ? 1 : 0)));

/** The special attributes of a line or a bar chart: the grid and the scale on the left */
export const plotAttributes = {
    // The lines of the grid at the parts of the height (`chartGrid` in the attributes)
    'chart-grid': {
        set(this: dia.ElementView, fractions: number[], refBBox: dia.BBox) {
            return { d: gridPath(plotArea(refBBox), fractions) };
        }
    },
    // The value of the scale at the part of the height (`chartScale` in the attributes)
    'chart-scale': {
        set(this: dia.ElementView, fraction: number, _refBBox: dia.BBox, node: Element) {
            const { min, max } = getScale(this.model);
            V(node as SVGElement).text(formatScale(min + (max - min) * fraction), { textVerticalAnchor: 'middle' });
            return {};
        }
    }
};

/** The markup of the scale texts (`scale0`, `scale1`, ...) and their attributes */
export const scaleMarkup = SCALE.map((_, i) => `<text @selector='scale${i}' />`).join('');

export function scaleAttributes(): Record<string, object> {
    return Object.fromEntries(SCALE.map((fraction, i) => [`scale${i}`, {
        chartScale: fraction,
        x: PLOT_LEFT - 6,
        y: plotYCalc(fraction),
        textAnchor: 'end',
        fontSize: 10,
        fontFamily: 'sans-serif',
        fill: '#9aa5b1'
    }]));
}

/** An arc of a circle from one angle to another (degrees, clockwise from the right), as an open path */
export function arcPath(center: g.Point, radius: number, from: number, to: number): string {
    const point = (angle: number) => {
        const radians = angle * Math.PI / 180;
        return `${Number((center.x + radius * Math.cos(radians)).toFixed(2))} ${Number((center.y + radius * Math.sin(radians)).toFixed(2))}`;
    };
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M ${point(from)} A ${radius} ${radius} 0 ${large} 1 ${point(to)}`;
}

/** How many values a line chart keeps (the newest on the right) */
export const CHART_POINTS = 12;

/** A view rendering the chart again when its data (the attributes of the model) changes */
export function chartView(dataAttributes: string[]): typeof dia.ElementView {
    return dia.ElementView.extend({
        presentationAttributes: dia.ElementView.addPresentationAttributes(
            Object.fromEntries(dataAttributes.map(attribute => [attribute, dia.ElementView.Flags.UPDATE]))
        )
    });
}
