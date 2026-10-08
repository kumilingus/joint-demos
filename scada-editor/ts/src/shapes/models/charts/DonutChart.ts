import { type dia, g, util, V } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import { Layer, LIQUID_COLOR, MAX_LIQUID_COLOR } from '../../../const';
import Shape from '../Shape';
import { dataOf } from '../../common/data';

/** A slice of a donut chart: what it is, how much of it and its color */
export interface Slice {
    label: string;
    value: number;
    color: string;
}

/** The most slices a donut shows (edited in the inspector) */
export const MAX_SLICES = 6;
const range = Array.from({ length: MAX_SLICES }, (_, i) => i);

// The legend on the right of the donut: the distance of its lines
const LEGEND_LINE = 20;

// The donut in the left part of the screen: its hole, a part of the radius
const HOLE = 0.55;
const PADDING = 14;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='screen' />
    ${range.map(i => `<path @selector='slice${i}' />`).join('')}
    ${range.map(i => `<rect @selector='swatch${i}' /><text @selector='legend${i}' />`).join('')}
    <text @selector='label' />
`;

/** The center and the radius of the donut in the element */
function donut(bbox: dia.BBox): { center: g.Point; radius: number } {
    const radius = bbox.height / 2 - PADDING;
    return { center: new g.Point(bbox.x + PADDING + radius, bbox.y + bbox.height / 2), radius };
}

/** The shares of the slices (0 - 1), in their order */
function shares(slices: Slice[]): number[] {
    const values = slices.map(slice => sliceValue(slice));
    const total = values.reduce((sum, value) => sum + value, 0) || 1;
    return values.map(value => value / total);
}

/** The value of the slice: none if it is not a positive number (a field cleared in the inspector) */
function sliceValue(slice: Slice): number {
    const value = Number(slice.value);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** The slices of the model (at most `MAX_SLICES`) */
function getSlices(model: dia.Cell): Slice[] {
    const slices = dataOf(model, 'slices');
    return Array.isArray(slices) ? slices.slice(0, MAX_SLICES) : [];
}

/** The line of the legend of the slice: the lines centered on the height */
function legendY(count: number, index: number, bbox: dia.BBox): number {
    return bbox.y + bbox.height / 2 + (index - (count - 1) / 2) * LEGEND_LINE;
}

/** The ring segment of the slice: from the top, clockwise, after the slices before it */
function slicePath(slices: Slice[], index: number, bbox: dia.BBox): string {
    const parts = shares(slices);
    if (!parts[index]) {
        return 'M 0 0';
    }
    const { center, radius } = donut(bbox);
    const inner = radius * HOLE;
    const start = parts.slice(0, index).reduce((sum, part) => sum + part, 0);
    // A whole ring is drawn a hair short of the full circle (an arc can't end where it starts).
    const end = Math.min(start + parts[index], start + 0.9999);
    const point = (r: number, ratio: number) => {
        const angle = ratio * 2 * Math.PI - Math.PI / 2;
        return `${Number((center.x + r * Math.cos(angle)).toFixed(2))} ${Number((center.y + r * Math.sin(angle)).toFixed(2))}`;
    };
    const large = end - start > 0.5 ? 1 : 0;
    return [
        `M ${point(radius, start)}`,
        `A ${radius} ${radius} 0 ${large} 1 ${point(radius, end)}`,
        `L ${point(inner, end)}`,
        `A ${inner} ${inner} 0 ${large} 0 ${point(inner, start)}`,
        'Z'
    ].join(' ');
}

/**
 * A donut chart: the shares of the parts of a whole (`slices`, edited in the inspector),
 * with a legend. In the runtime mode the shares change (see `plant/mock/mock-plant.ts`).
 */
export default class DonutChart extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    get tagPrefix(): string {
        return 'MIX';
    }

    static attributes = {
        ...Shape.attributes,
        // The slice of the model at the index (`chartSlice` in the attributes): in its color
        'chart-slice': {
            set(this: dia.ElementView, index: number, refBBox: dia.BBox) {
                const slices = getSlices(this.model);
                return { d: slicePath(slices, index, refBBox), fill: slices[index]?.color || 'none' };
            }
        },
        // The color of the slice at the index in the legend
        'chart-swatch': {
            set(this: dia.ElementView, index: number, refBBox: dia.BBox) {
                const slices = getSlices(this.model);
                const slice = slices[index];
                if (!slice) {
                    return { display: 'none' };
                }
                return { display: 'inline', y: legendY(slices.length, index, refBBox) - 5, fill: slice.color || 'none' };
            }
        },
        // The legend of the slice at the index: its label and its share
        'chart-legend': {
            set(this: dia.ElementView, index: number, refBBox: dia.BBox, node: Element) {
                const slices = getSlices(this.model);
                const slice = slices[index];
                if (!slice) {
                    return { display: 'none' };
                }
                const text = `${slice.label ?? ''} ${Math.round(shares(slices)[index] * 100)} %`;
                if (node instanceof SVGElement) {
                    V(node).text(text, { textVerticalAnchor: 'middle' });
                }
                return { display: 'inline', y: legendY(slices.length, index, refBBox) };
            }
        }
    };

    defaults(): dia.Element.Attributes {
        const parts: Record<string, object> = {};
        range.forEach((i) => {
            parts[`slice${i}`] = { chartSlice: i, stroke: '#1e272e', strokeWidth: 2 };
            parts[`swatch${i}`] = { chartSwatch: i, x: 'calc(h + 6)', width: 10, height: 10, rx: 2, ry: 2 };
            parts[`legend${i}`] = { chartLegend: i, x: 'calc(h + 22)', fontSize: 12, fontFamily: 'sans-serif', fill: '#dfe6ee' };
        });
        return {
            ...super.defaults,
            type: 'DonutChart',
            // Its label (see `from-model`)
            label: { text: 'Donut Chart', position: 'bottom' },
            // What it shows (see `data.ts`)
            data: {
                slices: [
                    // Generic parts: the app (the inspector, the plant data) says what they are
                    { label: 'Part A', value: 50, color: '#60a5fa' },
                    { label: 'Part B', value: 30, color: MAX_LIQUID_COLOR },
                    { label: 'Part C', value: 20, color: LIQUID_COLOR }
                ]
            },
            size: {
                width: 240,
                height: 120
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
                ...parts,
                label: {
                    ...labelAttributes
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
