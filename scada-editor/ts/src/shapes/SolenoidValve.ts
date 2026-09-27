import { type dia, util } from '@joint/plus';
import { centerPortPosition, labelAttributes, pipePorts } from './ports';
import { bowTieAttributes } from './valveBody';
import { LIQUID_COLOR } from '../const';
import type { Overflow } from './footprint';
import { Shape, type Resizable, type ControlKind } from './Shape';

/** An electrically operated valve: the coil on top lights up when the valve is open. */
export class SolenoidValve extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get control(): ControlKind {
        return 'toggle';
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 32 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'SolenoidValve',
            size: {
                width: 60,
                height: 40
            },
            open: true,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                stem: {
                    d: 'M calc(w / 2) calc(h / 2) V -8',
                    stroke: '#555',
                    strokeWidth: 3
                },
                body: bowTieAttributes,
                coil: {
                    x: 'calc(w / 2 - 15)',
                    y: -32,
                    width: 30,
                    height: 24,
                    rx: 3,
                    ry: 3,
                    fill: '#555',
                    stroke: '#222',
                    strokeWidth: 2
                },
                coilLabel: {
                    text: 'S',
                    x: 'calc(w / 2)',
                    y: -20,
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold'
                },
                label: {
                    ...labelAttributes,
                    text: 'Solenoid Valve'
                }
            },
            ports: pipePorts(centerPortPosition)
        };
    }

    preinitialize(): void {
        this.markup = util.svg/* xml */`
            <path @selector='stem' />
            <path @selector='body' />
            <rect @selector='coil' />
            <text @selector='coilLabel' />
            <text @selector='label' />
        `;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateCoil();
        this.on('change:open', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateCoil(options));
    }

    updateCoil(options?: dia.Cell.Options): void {
        this.attr('coilLabel/fill', this.get('open') ? LIQUID_COLOR : '#bbb', options);
    }
}
