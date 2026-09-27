import { type dia, util } from '@joint/plus';
import type { Overflow } from './footprint';
import { Layer } from '../const';
import { Shape, type Resizable } from './Shape';

/**
 * An ISA instrument bubble: the function of the instrument on the top
 * (e.g. PT = pressure transmitter, FT = flow, LT = level, TT = temperature)
 * and the loop number on the bottom.
 */
export class Instrument extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get rotatable(): boolean {
        return false;
    }

    get overflow(): Overflow {
        return { bottom: 0 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Instrument',
            size: {
                width: 60,
                height: 60
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 'calc(w / 2)',
                    fill: '#fff',
                    stroke: '#333',
                    strokeWidth: 2
                },
                // The line of a panel-mounted instrument
                divider: {
                    d: 'M 0 calc(h / 2) H calc(w)',
                    stroke: '#333',
                    strokeWidth: 2
                },
                tag: {
                    text: 'PT',
                    x: 'calc(w / 2)',
                    y: 'calc(h / 2 - 4)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'bottom',
                    fontSize: 15,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fill: '#131e29'
                },
                loop: {
                    text: '101',
                    x: 'calc(w / 2)',
                    y: 'calc(h / 2 + 4)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'top',
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                    fill: '#131e29'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = util.svg/* xml */`
            <circle @selector='body' />
            <path @selector='divider' />
            <text @selector='tag' />
            <text @selector='loop' />
        `;
    }
}
