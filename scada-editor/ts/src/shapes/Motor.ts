import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE, pipeGradient } from './gradients';
import type { Overflow } from './footprint';
import { Shape, type ControlKind } from './Shape';

// The cooling fins across the housing (relative x positions)
const FINS = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
    .map(x => `M calc(${x} * w) 6 V calc(h - 6)`)
    .join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='feet' />
    <rect @selector='shaft' />
    <rect @selector='endCap' />
    <rect @selector='body' />
    <path @selector='fins' />
    <rect @selector='terminalBox' />
    <text @selector='label' />
`;

/** An electric motor: a finned housing on feet with the shaft on the right. */
export class Motor extends Shape {

    get control(): ControlKind {
        return 'power';
    }

    get overflow(): Overflow {
        return { top: 12, right: 20, bottom: 34, left: 8 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Motor',
            size: {
                width: 100,
                height: 60
            },
            // 0 = off, 1 = on
            power: 0,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                feet: {
                    d: 'M calc(0.1 * w) calc(h) h calc(0.25 * w) l 4 8 h calc(-0.25 * w - 8) Z M calc(0.65 * w) calc(h) h calc(0.25 * w) l 4 8 h calc(-0.25 * w - 8) Z',
                    fill: '#555',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                shaft: {
                    x: 'calc(w - 2)',
                    y: 'calc(h / 2 - 5)',
                    width: 22,
                    height: 10,
                    fill: '#999',
                    stroke: '#555',
                    strokeWidth: 1.5
                },
                endCap: {
                    x: -8,
                    y: 8,
                    width: 12,
                    height: 'calc(h - 16)',
                    rx: 3,
                    ry: 3,
                    fill: '#777',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 8,
                    ry: 8,
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: pipeGradient
                },
                fins: {
                    d: FINS,
                    stroke: METAL_STROKE,
                    strokeOpacity: 0.6,
                    strokeWidth: 2
                },
                terminalBox: {
                    x: 'calc(0.35 * w)',
                    y: -12,
                    width: 'calc(0.3 * w)',
                    height: 14,
                    rx: 2,
                    ry: 2,
                    fill: '#555',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    text: 'Motor',
                    y: 'calc(h + 16)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
