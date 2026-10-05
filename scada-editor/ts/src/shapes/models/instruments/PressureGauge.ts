import { type dia, g, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type Resizable } from '../../common/Shape';
import type { Thresholds } from './Panel';
import { Layer, MAX_LIQUID_COLOR, MIN_LIQUID_COLOR } from '../../../const';
import { dataOf } from '../../common/data';

// The size the dial is drawn for: it is scaled to the size of the element (kept square, see `resizable`)
const DIAL_SIZE = 60;

// The dial is drawn around the center of the element, scaled to its size.
const dialTransform = `translate(calc(w / 2), calc(h / 2)) scale(calc(w / ${DIAL_SIZE}))`;

// The scale: 270° from the bottom left (0 %) to the bottom right (100 %), clockwise
const SCALE_START = 135;
const SCALE_SWEEP = 270;

// Ticks on the scale
const TICKS = Array.from({ length: 7 }, (_, i) => {
    const angle = (SCALE_START + i * SCALE_SWEEP / 6) * Math.PI / 180;
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
    const p = (r: number) => `${(r * cos).toFixed(2)} ${(r * sin).toFixed(2)}`;
    return `M ${p(17)} L ${p(22)}`;
}).join(' ');

// The radius of the warning zones of the scale
const ZONE_RADIUS = 22;

const DEFAULT_THRESHOLDS: Thresholds = { low: 0, high: 75 };

/** The angle (in degrees) of a value (0 - 100) on the scale. */
const scaleAngle = (value: number) => g.scale.linear([0, 100], [SCALE_START, SCALE_START + SCALE_SWEEP], value);

/** An arc of the scale between two values (nothing if they're the same). */
function zone(from: number, to: number): string {
    if (to <= from) return 'M 0 0';
    const point = (value: number) => {
        const angle = scaleAngle(value) * Math.PI / 180;
        return `${(ZONE_RADIUS * Math.cos(angle)).toFixed(2)} ${(ZONE_RADIUS * Math.sin(angle)).toFixed(2)}`;
    };
    const large = scaleAngle(to) - scaleAngle(from) > 180 ? 1 : 0;
    return `M ${point(from)} A ${ZONE_RADIUS} ${ZONE_RADIUS} 0 ${large} 1 ${point(to)}`;
}

const clamp = (value: unknown) => Math.max(0, Math.min(100, Number(value) || 0));

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='stem' />
    <circle @selector='bezel' />
    <circle @selector='body' />
    <path @selector='ticks' />
    <path @selector='lowZone' />
    <path @selector='highZone' />
    <g @selector='needleGroup'>
        <path @selector='needle' />
    </g>
    <circle @selector='hub' />
    <text @selector='unit' />
    <text @selector='label' />
`;

// How wide the metal ring around the dial is (relative to the size)
const BEZEL = 1 / 12;

/**
 * A pressure gauge: a dial in a metal ring (its bezel - the color, the finish and the outline of the gauge,
 * as of the surfaces of the equipment), the needle pointing to the value.
 */
export default class PressureGauge extends Shape {
    // The accent: the needle
    get accentField(): ColorField {
        return { path: ['attrs', 'needle', 'fill'] };
    }

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    // Kept round: the dial scales with it
    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get rotatable(): boolean {
        return false;
    }

    // The stem and the label under it
    get overflow(): Overflow {
        return { bottom: 38 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'PressureGauge',
            // What it shows (see `data.ts`)
            data: {
                // The pressure in % of the scale
                value: 60,
                // The warning zones: below the low threshold (none by default) and above the high one
                thresholds: { ...DEFAULT_THRESHOLDS }
            },
            size: {
                width: 60,
                height: 60
            },
            attrs: {
                root: {
                    magnetSelector: 'bezel'
                },
                // The connection to the pipe: the same whatever the size of the dial
                stem: {
                    x: 'calc(w / 2 - 5)',
                    y: 'calc(h - 2)',
                    width: 10,
                    height: 16,
                    fill: '#999',
                    stroke: '#555',
                    strokeWidth: 2
                },
                // The metal ring: in the color and the finish of the gauge, outlined
                bezel: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 'calc(w / 2)',
                    surfaceFill: 'sphere',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                // The dial (its face light whatever the color: the ticks and the needle stay readable)
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: `calc(${0.5 - BEZEL} * w)`,
                    fill: 'var(--shape-face)',
                    surfaceStroke: 'edge',
                    strokeWidth: 1
                },
                ticks: {
                    d: TICKS,
                    transform: dialTransform,
                    stroke: 'var(--shape-gauge-ink)',
                    strokeWidth: 2,
                    strokeLinecap: 'round'
                },
                // The warning zones of the scale (see `dataAttributes()`)
                lowZone: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    transform: dialTransform,
                    fill: 'none',
                    stroke: MIN_LIQUID_COLOR,
                    strokeWidth: 3
                },
                highZone: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    transform: dialTransform,
                    fill: 'none',
                    stroke: MAX_LIQUID_COLOR,
                    strokeWidth: 3
                },
                needleGroup: {
                    transform: dialTransform
                },
                // Pointing up; turned (with a CSS transform, so that it sweeps) to the value.
                needle: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    d: 'M -3 0 L 0 -20 L 3 0 Z',
                    fill: 'var(--color-red)',
                    style: { transition: 'transform 0.6s ease-out' }
                },
                hub: {
                    transform: dialTransform,
                    r: 4,
                    fill: 'var(--shape-gauge-ink)'
                },
                unit: {
                    text: 'bar',
                    transform: dialTransform,
                    y: 15,
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 9,
                    fontFamily: 'sans-serif',
                    fill: 'var(--shape-gauge-unit)'
                },
                label: {
                    ...labelAttributes,
                    text: 'Gauge',
                    y: 'calc(h + 20)'
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

    /** The thresholds, with the low one never above the high one. */
    get thresholds(): Thresholds {
        const { low, high } = { ...DEFAULT_THRESHOLDS, ...dataOf<Thresholds>(this, 'thresholds') };
        const clampedLow = clamp(low);
        return { low: clampedLow, high: Math.max(clampedLow, clamp(high)) };
    }

    /**
     * The yellow zone from the start of the scale to the low threshold, the red one from the high threshold to the end;
     * the needle points to the value on the scale - drawn pointing up, at 270° (see `from-data.ts`)
     */
    dataAttributes(selector: string): Record<string, unknown> {
        const { low, high } = this.thresholds;
        switch (selector) {
            case 'lowZone': return { d: zone(0, low) };
            case 'highZone': return { d: zone(high, 100) };
            case 'needle': return { style: { transform: `rotate(${(scaleAngle(clamp(dataOf(this, 'value'))) - 270).toFixed(1)}deg)` }};
            default: return {};
        }
    }

}
