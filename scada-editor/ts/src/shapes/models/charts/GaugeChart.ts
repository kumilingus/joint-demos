import { type dia, g, util, V } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import { Layer, LIQUID_COLOR } from '../../../const';
import { arcPath, getScale, scaleFraction } from '../../common/charts';
import Shape, { type ColorField } from '../../common/Shape';

// The arc of the scale: from the bottom left, clockwise, to the bottom right (degrees, clockwise from the right)
const START = 135;
const SWEEP = 270;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='screen' />
    <path @selector='track' />
    <path @selector='arc' />
    <text @selector='value' />
    <text @selector='unit' />
    <text @selector='label' />
`;

/** The center and the radius of the arc in the element */
function dial(bbox: dia.BBox): { center: g.Point; radius: number } {
    const radius = Math.min(bbox.width, bbox.height) / 2 - 18;
    return { center: new g.Point(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2 + 4), radius };
}

/** How much of the scale the value takes (0 - 1) */
function fraction(model: dia.Cell): number {
    return scaleFraction(getScale(model), Number(model.get('value')) || 0);
}

/**
 * A gauge chart: a value (`value` from `min` to `max`) as an arc on its scale, with the value and its unit.
 * In the runtime mode the value changes (see `plant/mock/mock-plant.ts`).
 */
export default class GaugeChart extends Shape {

    // The accent: the arc of the value (and the number)
    get accentField(): ColorField {
        return { path: ['attrs', 'arc', 'stroke'] };
    }

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    get tagPrefix(): string {
        return 'PI';
    }

    static attributes = {
        ...Shape.attributes,
        // The arc of the scale (`chartArc` in the attributes: 'track' all of it, 'value' as much as the value)
        'chart-arc': {
            set(this: dia.ElementView, kind: 'track' | 'value', refBBox: dia.BBox) {
                const { center, radius } = dial(refBBox);
                const sweep = kind === 'track' ? SWEEP : Math.max(0.5, SWEEP * fraction(this.model));
                return { d: arcPath(center, radius, START, START + sweep) };
            }
        },
        // The value of the model as a text
        'chart-value': {
            set(this: dia.ElementView, digits: number, _refBBox: dia.BBox, node: Element) {
                V(node as SVGElement).text((Number(this.model.get('value')) || 0).toFixed(digits), { textVerticalAnchor: 'middle' });
                return {};
            }
        }
    };

    defaults(): dia.Element.Attributes {
        const arc = { fill: 'none', strokeWidth: 10, strokeLinecap: 'round' };
        return {
            ...super.defaults,
            type: 'GaugeChart',
            size: {
                width: 130,
                height: 130
            },
            // The scale (bar): the feedwater pressure of the plant fits (see `plant/mock/mock-plant.ts`)
            min: 0,
            max: 16,
            value: 10.5,
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
                track: { ...arc, chartArc: 'track', stroke: '#fff', strokeOpacity: 0.12 },
                arc: { ...arc, chartArc: 'value', stroke: LIQUID_COLOR },
                value: {
                    chartValue: 1,
                    x: 'calc(0.5 * w)',
                    y: 'calc(0.5 * h + 2)',
                    textAnchor: 'middle',
                    fontSize: 24,
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    // Of the color of the arc (the accent)
                    fillFrom: ['arc', 'stroke']
                },
                unit: {
                    text: 'bar',
                    x: 'calc(0.5 * w)',
                    y: 'calc(0.5 * h + 26)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 12,
                    fontFamily: 'sans-serif',
                    fill: '#9aa5b1'
                },
                label: {
                    ...labelAttributes,
                    text: 'Gauge'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
