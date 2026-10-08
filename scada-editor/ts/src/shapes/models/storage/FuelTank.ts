import { type dia, util } from '@joint/plus';
import { pipePorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type ColorField, type Resizable } from '../Shape';
import { SURFACE_INK } from '../../../const';
import { type DataKey, dataOf } from '../../common/data';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='saddles' />
    <rect @selector='body' />
    <rect @selector='glass' />
    <rect @selector='fuel' />
    <text @selector='mark' />
    <text @selector='label' />
`;

// The sight glass of the level on the front: where, and how high
const GLASS_Y = 0.2;
const GLASS_HEIGHT = 0.6;

/** A fuel tank (the day tank of a generator): the fuel level in its sight glass, the fuel out by the pipes. */
export default class FuelTank extends Shape {
    // The accent: the fuel in the sight glass (its level is the plant's)
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['fuel', 'fill'] };
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get stubLength(): number {
        return 20;
    }

    get tagPrefix(): string {
        return 'DT';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'FuelTank',
            // Its label (see `from-model`)
            label: { text: 'Fuel Tank', position: 'bottom' },
            // What it shows (see `data.ts`)
            data: {
                level: 70
            },
            size: {
                width: 160,
                height: 80
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                saddles: {
                    d: 'M calc(0.2 * w) calc(0.9 * h) V calc(h) M calc(0.8 * w) calc(0.9 * h) V calc(h)',
                    stroke: '#555',
                    strokeWidth: 8
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(0.9 * h)',
                    rx: 'calc(0.15 * h)',
                    ry: 'calc(0.15 * h)',
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 3
                },
                glass: {
                    x: 'calc(0.44 * w)',
                    y: `calc(${GLASS_Y} * h)`,
                    width: 'calc(0.12 * w)',
                    height: `calc(${GLASS_HEIGHT} * h)`,
                    rx: 3,
                    ry: 3,
                    fill: '#1e272e',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                fuel: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'accent' },
                    // Computed (see `getComputedAttrs()`)
                    computed: true,
                    x: 'calc(0.44 * w + 2)',
                    width: 'calc(0.12 * w - 4)',
                    rx: 2,
                    ry: 2,
                    fill: 'var(--shape-fuel)'
                },
                mark: {
                    text: 'FUEL',
                    x: 'calc(0.22 * w)',
                    y: 'calc(0.5 * h)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 12,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fill: SURFACE_INK
                },
                label: {
                    ...labelAttributes
                }
            },
            ports: pipePorts(this.stubLength, { left: 0.5, right: 0.5 })
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
    }

    // The fuel glides to a new level (see `glide.ts`)
    get glideProperty(): DataKey {
        return 'level';
    }

    glideKeyframes(level: number): Record<string, Keyframe> {
        const { height: h } = this.size();
        const height = GLASS_HEIGHT * Math.max(0, Math.min(100, level)) / 100;
        return { fuel: { y: `${(GLASS_Y + GLASS_HEIGHT - height) * h}px`, height: `${height * h}px` }};
    }

    /** The fuel in the sight glass as high as the level, from its bottom (see `computed.ts`) */
    getComputedAttrs(selector: string): Record<string, unknown> {
        if (selector !== 'fuel') return {};
        const ratio = Math.max(0, Math.min(100, Number(dataOf(this, 'level')) || 0)) / 100;
        const height = GLASS_HEIGHT * ratio;
        return {
            y: `calc(${(GLASS_Y + GLASS_HEIGHT - height).toFixed(4)} * h)`,
            height: `calc(${height.toFixed(4)} * h)`
        };
    }

}
