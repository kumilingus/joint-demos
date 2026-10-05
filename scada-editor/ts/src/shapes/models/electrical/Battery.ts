import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type Resizable } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='minusPost' />
    <rect @selector='plusPost' />
    <rect @selector='body' />
    <rect @selector='lid' />
    <rect @selector='sticker' />
    <text @selector='minus' />
    <text @selector='plus' />
    <text @selector='label' />
`;

// The posts on the lid: from the left, a part of the width
const MINUS_X = 0.25;
const PLUS_X = 0.75;

/** A battery: a source of the power (always), the posts on its lid. */
export default class Battery extends Shape {

    get resizable(): Resizable {
        return false;
    }

    // The posts above it
    get overflow(): Overflow {
        return { top: 10 };
    }

    get tagPrefix(): string {
        return 'BAT';
    }

    defaults(): dia.Element.Attributes {
        const post = { y: -10, width: 14, height: 12, rx: 2, ry: 2, stroke: '#222', strokeWidth: 1.5 };
        const sign = { y: 'calc(0.2 * h + 1)', textAnchor: 'middle', textVerticalAnchor: 'middle', fontSize: 14, fontFamily: 'sans-serif', fontWeight: 'bold', fill: '#ffffff' };
        return {
            ...super.defaults,
            type: 'Battery',
            // Its label (see `text-from`)
            label: { text: 'Battery', position: 'bottom' },
            size: {
                width: 80,
                height: 60
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                minusPost: { ...post, x: `calc(${MINUS_X} * w - 7)`, fill: '#333' },
                plusPost: { ...post, x: `calc(${PLUS_X} * w - 7)`, fill: '#c0392b' },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 4,
                    ry: 4,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                lid: {
                    width: 'calc(w)',
                    height: 'calc(0.4 * h)',
                    rx: 4,
                    ry: 4,
                    fill: '#2f3a45',
                    stroke: '#1f272e',
                    strokeWidth: 2
                },
                sticker: {
                    x: 'calc(0.15 * w)',
                    y: 'calc(0.5 * h)',
                    width: 'calc(0.7 * w)',
                    height: 'calc(0.36 * h)',
                    rx: 2,
                    ry: 2,
                    surfaceFill: 'cylinder',
                    surfaceStroke: 'edge',
                    strokeWidth: 1
                },
                minus: { ...sign, text: '−', x: `calc(${MINUS_X} * w)` },
                plus: { ...sign, text: '+', x: `calc(${PLUS_X} * w)` },
                label: {
                    ...labelAttributes
                }
            },
            ports: terminalPorts([
                { id: 'minus', side: 'top', along: `calc(${MINUS_X} * w)` },
                { id: 'plus', side: 'top', along: `calc(${PLUS_X} * w)` }
            ])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
