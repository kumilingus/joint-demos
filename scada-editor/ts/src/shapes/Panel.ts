import { type dia, util } from '@joint/plus';
import { Layer, LIQUID_COLOR, MAX_LIQUID_COLOR, MIN_LIQUID_COLOR } from '../const';
import { METAL_STROKE, plateGradient } from './gradients';
import type { Overflow } from './footprint';
import { Shape } from './Shape';

// The margins of the window: fixed, the window takes the rest of the height.
const WINDOW_TOP = 15;
const WINDOW_BOTTOM = 15;

// The scale: 0, 10, ... 100
const STEPS = 10;

/** A number with an explicit sign, for `calc()`. */
const signed = (value: number) => `${value < 0 ? '-' : '+'} ${Math.abs(Number(value.toFixed(3)))}`;

/**
 * The y coordinate at the relative height `ratio` of the window (0 = top, 1 = bottom),
 * moved by `offset`.
 * `calc()` takes a single variable: `ratio * (h - WINDOW_TOP - WINDOW_BOTTOM) + WINDOW_TOP + offset`
 * is written as `ratio * h + constant`.
 */
function windowY(ratio: number, offset = 0): string {
    return `calc(${Number(ratio.toFixed(3))} * h ${signed(WINDOW_TOP - ratio * (WINDOW_TOP + WINDOW_BOTTOM) + offset)})`;
}

/** A part of the height of the window (0 - 1). */
function windowHeight(ratio: number): string {
    return `calc(${Number(ratio.toFixed(3))} * h ${signed(-ratio * (WINDOW_TOP + WINDOW_BOTTOM))})`;
}

const TICKS = Array.from({ length: STEPS + 1 }, (_, i) => `M calc(0.55 * w) ${windowY(i / STEPS)} h 8`).join(' ');

// A text for each value of the scale, next to its tick
const VALUES = Array.from({ length: STEPS + 1 }, (_, i) => `value${i}`);

const valueAttributes = (i: number) => ({
    text: String(100 - i * 100 / STEPS),
    x: 'calc(0.8 * w)',
    y: windowY(i / STEPS),
    textAnchor: 'middle',
    textVerticalAnchor: 'middle',
    fontSize: 14,
    fontFamily: 'sans-serif'
});

/** The levels (0 - 100) at which the color of the liquid warns that the tank is almost empty or full. */
export interface Thresholds {
    low: number;
    high: number;
}

const DEFAULT_THRESHOLDS: Thresholds = { low: 20, high: 80 };

// A line across the window at each threshold (over the liquid), in the color it warns with
const thresholdLineAttributes = (color: string) => ({
    fill: 'none',
    stroke: color,
    strokeOpacity: 0.8,
    strokeWidth: 2,
    strokeDasharray: '4 3'
});

/** The line across the window at the level (0 - 100). */
const thresholdLine = (level: number) => `M calc(0.1 * w) ${windowY(1 - level / 100)} H calc(0.5 * w)`;

const windowAttributes = {
    x: 'calc(0.1 * w)',
    y: WINDOW_TOP,
    width: 'calc(0.4 * w)',
    height: windowHeight(1)
};

/**
 * A level gauge showing how full a tank is (0 - 100).
 * It's usually embedded in a tank so that it moves with it.
 * Everything but the text scales with the size of the element.
 */
export class Panel extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    get overflow(): Overflow {
        return { bottom: 0 };
    }

    get tagPrefix(): string {
        return 'LI';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Panel',
            size: {
                width: 100,
                height: 240
            },
            level: 0,
            thresholds: { ...DEFAULT_THRESHOLDS },
            attrs: {
                root: {
                    magnetSelector: 'panelBody'
                },
                panelBody: {
                    x: 0,
                    y: 0,
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 1,
                    ry: 1,
                    fill: plateGradient,
                    stroke: METAL_STROKE,
                    strokeWidth: 1.5
                },
                panelTicks: {
                    d: TICKS,
                    fill: 'none',
                    stroke: 'black',
                    strokeWidth: 2,
                    strokeLinecap: 'round'
                },
                ...Object.fromEntries(VALUES.map((selector, i) => [selector, valueAttributes(i)])),
                glass: {
                    ...windowAttributes,
                    fill: 'blue',
                    stroke: 'none',
                    fillOpacity: 0.1
                },
                liquid: {
                    x: 'calc(0.1 * w)',
                    width: 'calc(0.4 * w)',
                    stroke: 'black',
                    strokeWidth: 2,
                    strokeOpacity: 0.2,
                    fill: MIN_LIQUID_COLOR
                },
                frame: {
                    ...windowAttributes,
                    rx: 1,
                    ry: 1,
                    fill: 'none',
                    stroke: 'black',
                    strokeWidth: 3
                },
                lowMark: thresholdLineAttributes(MIN_LIQUID_COLOR),
                highMark: thresholdLineAttributes(MAX_LIQUID_COLOR)
            }
        };
    }

    preinitialize(): void {
        this.markup = util.svg/* xml */`
            <rect @selector='panelBody' />
            <path @selector='panelTicks' />
            ${VALUES.map(selector => `<text @selector='${selector}' />`).join('')}
            <rect @selector='glass' />
            <rect @selector='liquid' />
            <path @selector='lowMark' />
            <path @selector='highMark' />
            <rect @selector='frame' />
        `;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateLiquid();
        this.on('change:level change:thresholds', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateLiquid(options));
    }

    get level(): number {
        return clampLevel(this.get('level'));
    }

    /** The thresholds, with the low one never above the high one. */
    get thresholds(): Thresholds {
        const { low, high } = { ...DEFAULT_THRESHOLDS, ...this.get('thresholds') };
        const clampedLow = clampLevel(low);
        return { low: clampedLow, high: Math.max(clampedLow, clampLevel(high)) };
    }

    /**
     * The liquid rises from the bottom of the window to the level;
     * its color warns when the tank is almost empty (below the low threshold)
     * or full (above the high one). The thresholds are lines across the window.
     */
    updateLiquid(options?: dia.Cell.Options): void {
        const { level } = this;
        const { low, high } = this.thresholds;
        const ratio = level / 100;
        this.attr({
            liquid: {
                y: windowY(1 - ratio),
                height: windowHeight(ratio),
                fill: this.liquidColor(level)
            },
            lowMark: { d: thresholdLine(low) },
            highMark: { d: thresholdLine(high) }
        }, options);
    }

    /** The color of the liquid at the level: it warns when the tank is almost empty or full. */
    liquidColor(level: number): string {
        const { low, high } = this.thresholds;
        return level > high
            ? MAX_LIQUID_COLOR
            : level < low
                ? MIN_LIQUID_COLOR
                : LIQUID_COLOR;
    }

    /** The liquid at the level (0 - 100), as `updateLiquid()` draws it, for the current size. */
    liquidState(level: number): LiquidState {
        const windowSize = this.size().height - WINDOW_TOP - WINDOW_BOTTOM;
        const height = windowSize * clampLevel(level) / 100;
        return { y: WINDOW_TOP + windowSize - height, height, fill: this.liquidColor(clampLevel(level)) };
    }
}

/** The liquid at a level (0 - 100) in the coordinates of the element, computed from the model (see `animations.ts`). */
export interface LiquidState {
    y: number;
    height: number;
    fill: string;
}

function clampLevel(value: unknown): number {
    return Math.max(0, Math.min(100, Number(value) || 0));
}
