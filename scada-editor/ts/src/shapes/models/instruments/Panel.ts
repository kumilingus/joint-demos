import { type dia, util } from '@joint/plus';
import { Layer, LIQUID_COLOR, MAX_LIQUID_COLOR, MIN_LIQUID_COLOR } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField } from '../../common/Shape';
import { finishOf } from '../../common/gradients';
import { type DataKey, dataOf } from '../../common/data';

// The track of the liquid: below the value, fixed margins - the track takes the rest of the height
const WINDOW_TOP = 50;
const WINDOW_BOTTOM = 18;

// The screen of the panel (as the charts: the bezel around it)
const SCREEN_INSET = 6;
const SCREEN_COLOR = '#1e272e';
const SCREEN_TEXT = '#e6edf3';
const SCREEN_MUTED = '#8b98a5';
const TRACK_COLOR = '#2b3640';

// The same gap on both sides: from the edge of the screen to the threshold arrows, and to the values
const SIDE_GAP = 8;

// The threshold arrows (see `thresholdMarker()`): this wide, this far from the track
const ARROW_WIDTH = 6;
const ARROW_GAP = 3;

// The track: right of the arrows, a part of the width wide
const TRACK_LEFT = SCREEN_INSET + SIDE_GAP + ARROW_WIDTH + ARROW_GAP;
const TRACK_WIDTH = 0.3;

/** A distance from the left of the track (a part of the width `k` and pixels), for `calc()` */
const fromTrack = (k: number, px: number) => `calc(${k} * w + ${TRACK_LEFT + px})`;

// The scale: a tick every 10 %, a value every 50 %
const STEPS = 10;
const LABELED = [0, 5, 10];

/** A number with an explicit sign, for `calc()`. */
const signed = (value: number) => `${value < 0 ? '-' : '+'} ${Math.abs(Number(value.toFixed(3)))}`;

/**
 * The y coordinate at the relative height `ratio` of the track (0 = top, 1 = bottom),
 * moved by `offset`.
 * A `calc()` formula is `k * variable + constant`: `ratio * (h - WINDOW_TOP - WINDOW_BOTTOM) + WINDOW_TOP + offset`
 * is written as `ratio * h + constant`.
 */
function windowY(ratio: number, offset = 0): string {
    return `calc(${Number(ratio.toFixed(3))} * h ${signed(WINDOW_TOP - ratio * (WINDOW_TOP + WINDOW_BOTTOM) + offset)})`;
}

/** A part of the height of the track (0 - 1). */
function windowHeight(ratio: number): string {
    return `calc(${Number(ratio.toFixed(3))} * h ${signed(-ratio * (WINDOW_TOP + WINDOW_BOTTOM))})`;
}

// The ticks on the right of the track: longer at the values
const TICKS = Array.from({ length: STEPS + 1 }, (_, i) => `M ${fromTrack(TRACK_WIDTH, 5)} ${windowY(i / STEPS)} h ${LABELED.includes(i) ? 7 : 4}`).join(' ');

// A text at each labeled tick
const VALUES = LABELED.map(i => `value${i}`);

// The values right-aligned, the side gap from the edge of the screen (the widest, 100, clear of it)

const valueAttributes = (i: number) => ({
    text: String(100 - i * 100 / STEPS),
    x: `calc(w - ${SCREEN_INSET + SIDE_GAP})`,
    y: windowY(i / STEPS),
    textAnchor: 'end',
    textVerticalAnchor: 'middle',
    fontSize: 11,
    fontFamily: 'sans-serif',
    fill: SCREEN_MUTED
});

/** The levels (0 - 100) at which the color of the liquid warns that the tank is almost empty or full. */
export interface Thresholds {
    low: number;
    high: number;
}

const DEFAULT_THRESHOLDS: Thresholds = { low: 20, high: 80 };

/** The marker of a threshold at the level (0 - 100): a small arrow left of the track, pointing at it. */
const thresholdMarker = (level: number) => `M ${TRACK_LEFT - ARROW_GAP} ${windowY(1 - level / 100)} l -${ARROW_WIDTH} -4.5 v 9 z`;

const trackAttributes = {
    x: TRACK_LEFT,
    y: WINDOW_TOP,
    width: `calc(${TRACK_WIDTH} * w)`,
    height: windowHeight(1),
    rx: `calc(${TRACK_WIDTH / 2} * w)`,
    ry: `calc(${TRACK_WIDTH / 2} * w)`
};

// The light on the round track: from its left side, fading
const shineGradient: dia.SVGGradientJSON = {
    type: 'linearGradient',
    stops: [
        { offset: '0%', color: '#ffffff', opacity: 0 },
        { offset: '30%', color: '#ffffff', opacity: 0.22 },
        { offset: '55%', color: '#ffffff', opacity: 0 }
    ]
};

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='panelBody' />
    <rect @selector='screen' />
    <text @selector='value' />
    <rect @selector='track' />
    <rect @selector='liquid' />
    <rect @selector='shine' />
    <path @selector='panelTicks' />
    ${VALUES.map(selector => `<text @selector='${selector}' />`).join('')}
    <path @selector='lowMark' />
    <path @selector='highMark' />
`;

/**
 * A level gauge showing how full a tank is (0 - 100): on a screen as the charts, the level as a number above
 * a rounded track with the liquid in it, the thresholds as arrows beside it.
 * It's usually embedded in a tank so that it moves with it.
 * Everything but the text scales with the size of the element.
 */
export default class Panel extends Shape {
    // The accent: the color of the liquid in range (not the warnings: below the low threshold, above the high one)
    get accentField(): ColorField {
        return { path: ['liquidColor'], defaultValue: LIQUID_COLOR };
    }

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
            // What it shows (see `data.ts`)
            data: {
                level: 0,
                thresholds: { ...DEFAULT_THRESHOLDS }
            },
            size: {
                width: 100,
                height: 240
            },
            attrs: {
                root: {
                    magnetSelector: 'panelBody'
                },
                // The bezel (in the color of the panel, see `surfaceAttributes`) around the screen, as the charts
                panelBody: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 10,
                    ry: 10,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                screen: {
                    x: SCREEN_INSET,
                    y: SCREEN_INSET,
                    width: `calc(w - ${2 * SCREEN_INSET})`,
                    height: `calc(h - ${2 * SCREEN_INSET})`,
                    rx: 6,
                    ry: 6,
                    fill: SCREEN_COLOR,
                    stroke: '#111',
                    strokeWidth: 1
                },
                // The level as a number, above the track
                value: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    x: 'calc(0.5 * w)',
                    y: 30,
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 20,
                    fontWeight: 600,
                    fontFamily: 'ui-monospace, Menlo, monospace',
                    fill: SCREEN_TEXT
                },
                track: {
                    ...trackAttributes,
                    fill: TRACK_COLOR
                },
                liquid: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    x: TRACK_LEFT,
                    width: `calc(${TRACK_WIDTH} * w)`,
                    rx: `calc(${TRACK_WIDTH / 2} * w)`,
                    ry: `calc(${TRACK_WIDTH / 2} * w)`,
                    fill: MIN_LIQUID_COLOR
                },
                shine: {
                    ...trackAttributes,
                    trackShine: true,
                    pointerEvents: 'none'
                },
                panelTicks: {
                    d: TICKS,
                    fill: 'none',
                    stroke: SCREEN_MUTED,
                    strokeWidth: 1.2,
                    strokeLinecap: 'round'
                },
                ...Object.fromEntries(LABELED.map(i => [`value${i}`, valueAttributes(i)])),
                lowMark: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    fill: MIN_LIQUID_COLOR
                },
                highMark: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    fill: MAX_LIQUID_COLOR
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    static attributes = {
        ...Shape.attributes,
        // The light on the track (`trackShine` in the attributes): shaded only - none in the flat finish
        'track-shine': {
            set(this: dia.ElementView) {
                if (finishOf(this.model) === 'flat') return { fill: 'none' };
                return { fill: `url(#${this.paper!.defineGradient(shineGradient)})` };
            }
        }
    };

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
    }

    get level(): number {
        return clampLevel(dataOf(this, 'level'));
    }

    /** The thresholds, with the low one never above the high one. */
    get thresholds(): Thresholds {
        const { low, high } = { ...DEFAULT_THRESHOLDS, ...dataOf<Thresholds>(this, 'thresholds') };
        const clampedLow = clampLevel(low);
        return { low: clampedLow, high: Math.max(clampedLow, clampLevel(high)) };
    }

    /** The color of the liquid at the level: it warns when the tank is almost empty or full (its own color otherwise, the accent). */
    liquidColor(level: number): string {
        const { low, high } = this.thresholds;
        return level > high
            ? MAX_LIQUID_COLOR
            : level < low
                ? MIN_LIQUID_COLOR
                : this.get('liquidColor') ?? LIQUID_COLOR;
    }

    /** The liquid at the level (0 - 100), as `dataAttributes()` draws it, for the current size. */
    // Its liquid glides to a new level (see `animateLevel()` in `animations.ts`)
    get glideProperty(): DataKey {
        return 'level';
    }

    glideKeyframes(level: number): Record<string, Keyframe> {
        const { y, height, fill } = this.liquidState(level);
        return { liquid: { y: `${y}px`, height: `${height}px`, fill }};
    }

    liquidState(level: number): LiquidState {
        const windowSize = this.size().height - WINDOW_TOP - WINDOW_BOTTOM;
        const height = windowSize * clampLevel(level) / 100;
        return { y: WINDOW_TOP + windowSize - height, height, fill: this.liquidColor(clampLevel(level)) };
    }

    /**
     * The liquid rises from the bottom of the track to the level (the number above it); its color warns when the tank
     * is almost empty (below the low threshold) or full (above the high one). The thresholds are arrows beside the
     * track (see `from-data.ts`).
     */
    dataAttributes(selector: string): Record<string, unknown> {
        const { level } = this;
        const { low, high } = this.thresholds;
        const ratio = level / 100;
        switch (selector) {
            case 'liquid': return { y: windowY(1 - ratio), height: windowHeight(ratio), fill: this.liquidColor(level) };
            case 'value': return { text: `${Math.round(level)} %` };
            case 'lowMark': return { d: thresholdMarker(low) };
            case 'highMark': return { d: thresholdMarker(high) };
            default: return {};
        }
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
