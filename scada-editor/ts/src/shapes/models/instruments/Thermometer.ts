import { type dia, g, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import { LABEL_COLOR, Layer, MAX_LIQUID_COLOR } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type Resizable } from '../../common/Shape';
import { type DataKey, dataOf } from '../../common/data';
import { styleOf } from '../../common/style';

// The default color of the outline of the thermometer (the tube and the bulb)
const THERMOMETER_FRAME = 'var(--shape-thermometer-stroke)';

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
export default class Thermometer extends Shape {
    // Its color is the color of the liquid (the column, the bulb follows it); its Outline of the tube and the bulb
    get colorField(): ColorField {
        return { path: ['style', 'color'], part: ['column', 'fill'] };
    }

    static attributes = {
        ...Shape.attributes,
        // The bulb in the color of the liquid (`liquidFill` in the attributes): of its style, else of the column
        'liquid-fill': {
            set(this: dia.ElementView) {
                return { fill: styleOf<string>(this.model, 'color') ?? this.model.attr(['column', 'fill']) ?? MAX_LIQUID_COLOR };
            }
        }
    };

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
            // Its label (see `from-model`)
            label: { text: 'Thermometer', position: 'bottom' },
            // What it shows (see `data.ts`)
            data: {
                // The height of the column in % of the scale
                value: 60
            },
            size: {
                width: WIDTH,
                height: 120
            },
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
                    // The outline of the thermometer (its Outline, see `surfaceAttributes`), with the bulb
                    surfaceStroke: THERMOMETER_FRAME,
                    strokeWidth: 2
                },
                bulb: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h - 8)',
                    r: 'calc(0.75 * s)',
                    liquidFill: true,
                    surfaceStroke: THERMOMETER_FRAME,
                    strokeWidth: 2
                },
                column: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'color' },
                    // Computed (see `getComputedAttrs()`)
                    computed: true,
                    x: 'calc(w / 2 - 4)',
                    width: 8,
                    fill: MAX_LIQUID_COLOR
                },
                ticks: {
                    d: TICKS,
                    stroke: 'var(--shape-scale)',
                    strokeWidth: 1.5
                },
                // The temperature, next to the top of the column (see `getComputedAttrs()`)
                reading: {
                    // Computed (see `getComputedAttrs()`)
                    computed: true,
                    x: 'calc(w + 14)',
                    textVerticalAnchor: 'middle',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fontWeight: 600,
                    fill: LABEL_COLOR
                },
                label: {
                    ...labelAttributes,
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
    }

    // The column (and its reading) glides to a new value (see `glide.ts`)
    get glideProperty(): DataKey {
        return 'value';
    }

    glideKeyframes(value: number): Record<string, Keyframe> {
        const { height: h } = this.size();
        const top = g.scale.linear([0, 100], [0.68, 0.08], Math.max(0, Math.min(100, value)));
        return {
            column: { y: `${top * h}px`, height: `${(0.95 - top) * h - 8}px` },
            // Moved by its transform (a text's `y` can't be animated)
            reading: { transform: `translate(0px, ${top * h}px)` }
        };
    }

    /**
     * The column rises from the bulb to the value on the scale (the scale spans 8% to 68% of the height), the reading
     * (in °C, the scale is 0 - 100 °C) is next to its top - by a transform, as it glides (see `glideKeyframes()`)
     */
    getComputedAttrs(selector: string): Record<string, unknown> {
        const value = Math.max(0, Math.min(100, Number(dataOf(this, 'value')) || 0));
        const top = Number(g.scale.linear([0, 100], [0.68, 0.08], value).toFixed(3));
        if (selector === 'column') return { y: `calc(${top} * h)`, height: `calc(${(0.95 - top).toFixed(3)} * h - 8)` };
        if (selector === 'reading') return { y: 0, transform: `translate(0, calc(${top} * h))`, text: `${Math.round(value)} °C` };
        return {};
    }

}
