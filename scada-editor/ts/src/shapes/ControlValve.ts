import { type dia, util } from '@joint/plus';
import { LIQUID_COLOR } from '../const';
import { centerPortPosition, labelAttributes, pipePorts } from './ports';
import { METAL_STROKE, sphereGradient } from './gradients';
import type { Overflow } from './footprint';
import { Shape, type Resizable, type ControlKind } from './Shape';

// The cover slides over the frame opening (the frame is 30 wide with 3 on each side).
const COVER_MAX_WIDTH = 24;

export class ControlValve extends Shape {

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
            size: {
                width: 60,
                height: 60
            },
            // 0 = closed, 1 = fully open
            open: 1,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    rx: 'calc(w / 2)',
                    ry: 'calc(h / 2)',
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: sphereGradient
                },
                liquid: {
                    d: 'M calc(w / 2 + 12) calc(h / 2) h -24',
                    stroke: LIQUID_COLOR,
                    strokeWidth: 24,
                    strokeDasharray: '3,1'
                },
                cover: {
                    x: 'calc(w / 2 - 12)',
                    y: 'calc(h / 2 - 12)',
                    width: 0,
                    height: 24,
                    stroke: '#333',
                    strokeWidth: 2,
                    fill: '#fff'
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
                    stroke: '#333',
                    strokeWidth: 2,
                    fill: '#555'
                },
                control: {
                    d: 'M 0 0 C 0 -30 60 -30 60 0 Z',
                    transform: 'translate(calc(w / 2 - 30), -20)',
                    stroke: '#333',
                    strokeWidth: 2,
                    fill: '#666'
                },
                label: {
                    ...labelAttributes,
                    text: 'Valve'
                }
            },
            ports: pipePorts(centerPortPosition)
        };
    }

    preinitialize(): void {
        this.markup = util.svg/* xml */`
            <rect @selector='stem' />
            <path @selector='control' />
            <ellipse @selector='body' />
            <rect @selector='coverFrame' />
            <path @selector='liquid' />
            <rect @selector='cover' />
            <text @selector='label' />
        `;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateCover();
        this.on('change:open', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateCover(options));
    }

    /** The more the valve is closed, the wider the cover. */
    updateCover(options?: dia.Cell.Options): void {
        const open = Math.max(0, Math.min(1, this.get('open') ?? 1));
        this.attr('cover/width', Math.round(COVER_MAX_WIDTH * (1 - open)), options);
    }
}
