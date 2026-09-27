import { dia, util } from '@joint/plus';
import { Layer } from '../const';
import { followRouting, routingAttributes } from './routing';

/** A signal line: an instrument (a transmitter) connected to what it measures or controls. */
export class SignalLine extends dia.Link {

    defaults(): dia.Link.Attributes {
        return {
            ...super.defaults,
            type: 'SignalLine',
            layer: Layer.Instruments,
            routing: 'straight',
            ...routingAttributes('straight'),
            attrs: {
                // An invisible wide stroke that makes the thin line easy to grab.
                wrapper: {
                    connection: true,
                    stroke: 'transparent',
                    strokeWidth: 20,
                    strokeLinecap: 'round',
                    cursor: 'move'
                },
                line: {
                    connection: true,
                    stroke: '#555',
                    strokeWidth: 1.5,
                    strokeDasharray: '4 3',
                    pointerEvents: 'none'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = util.svg/* xml */`
            <path @selector='wrapper' fill='none' />
            <path @selector='line' fill='none' />
        `;
    }

    initialize(...args: Parameters<dia.Link['initialize']>): void {
        super.initialize(...args);
        followRouting(this);
    }
}
