import { type dia, util } from '@joint/plus';
import { PIPE_COLOR } from '../../../const';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type Resizable, type ControlKind } from '../../common/Shape';
import { dataOf } from '../../common/data';

// The cover slides over the frame opening (the frame is 30 wide with 3 on each side).
const COVER_MAX_WIDTH = 24;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <rect @selector='stem' />
    <path @selector='control' />
    <ellipse @selector='body' />
    <rect @selector='coverFrame' />
    <path @selector='liquidOutline' />
    <path @selector='liquid' />
    <path @selector='flow' />
    <rect @selector='cover' />
    <text @selector='label' />
`;

export default class ControlValve extends Shape {
    // The accent: the actuator
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['control', 'fill'] };
    }

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'slider';
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 42 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'ControlValve',
            // Its label (see `from-model`)
            label: { text: 'Valve', position: 'top' },
            // What it shows (see `data.ts`)
            data: {
                // 0 = closed, 1 = fully open
                open: 1
            },
            size: {
                width: 60,
                height: 60
            },
            attrs: {
                pipe: pipeThroughAttributes(),
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    rx: 'calc(w / 2)',
                    ry: 'calc(h / 2)',
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'sphere'
                },
                // The pipe seen through the window: as tall as the pipes, with their outline (see `Pipe`)
                liquidOutline: {
                    d: 'M calc(w / 2 - 12) calc(h / 2) h 24',
                    stroke: '#444',
                    strokeWidth: 16
                },
                liquid: {
                    d: 'M calc(w / 2 - 12) calc(h / 2) h 24',
                    stroke: PIPE_COLOR,
                    strokeWidth: 10
                },
                // The dashes of the flowing liquid: hidden, shown by the animation in the runtime mode
                flow: {
                    d: 'M calc(w / 2 - 12) calc(h / 2) h 24',
                    fill: 'none',
                    stroke: '#ffffff',
                    strokeOpacity: 0,
                    strokeWidth: 3,
                    strokeDasharray: '6 18',
                    strokeLinecap: 'round'
                },
                cover: {
                    // Computed (see `attrsOf()`)
                    computed: true,
                    x: 'calc(w / 2 - 12)',
                    y: 'calc(h / 2 - 12)',
                    width: 0,
                    height: 24,
                    stroke: '#333',
                    strokeWidth: 2,
                    fill: 'var(--shape-valve-cover)'
                },
                coverFrame: {
                    x: 'calc(w / 2 - 15)',
                    y: 'calc(h / 2 - 15)',
                    width: 30,
                    height: 30,
                    stroke: '#777',
                    strokeWidth: 2,
                    fill: 'none',
                    rx: 1,
                    ry: 1
                },
                stem: {
                    width: 10,
                    height: 30,
                    x: 'calc(w / 2 - 5)',
                    y: -30,
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 2,
                    surfaceFill: 'dark'
                },
                control: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'accent' },
                    d: 'M 0 0 C 0 -30 60 -30 60 0 Z',
                    transform: 'translate(calc(w / 2 - 30), -20)',
                    stroke: '#333',
                    strokeWidth: 2,
                    fill: 'var(--shape-valve-operator)'
                },
                label: {
                    ...labelAttributes,
                    // Above it: its control below (see `controlPosition` in `controls.ts`)
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
    }

    /** The more the valve is closed, the wider the cover (see `computed.ts`) */
    attrsOf(selector: string): Record<string, unknown> {
        if (selector !== 'cover') return {};
        const open = Math.max(0, Math.min(1, dataOf<number>(this, 'open') ?? 1));
        return { width: Math.round(COVER_MAX_WIDTH * (1 - open)) };
    }

    /** Without the color of the pipe in its window: of the pipe it sits on, set again on load (see `PipeColorController`) */
    toJSON(options?: dia.Cell.ExportOptions): dia.Cell.JSON {
        const json = super.toJSON(options);
        const liquid = json.attrs?.liquid;
        if (liquid) {
            delete liquid.stroke;
            if (Object.keys(liquid).length === 0) delete (json.attrs as Record<string, unknown>).liquid;
        }
        return json;
    }

}
