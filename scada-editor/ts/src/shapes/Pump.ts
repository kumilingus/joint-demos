import { type dia, util } from '@joint/plus';
import { labelAttributes, pipePorts } from './ports';
import { METAL_STROKE, sphereGradient } from './gradients';
import Shape, { type Resizable, type ControlKind } from './Shape';

// Rotor metrics
const r = 30;
const d = 10;
const l = (3 * r) / 4;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <ellipse @selector='body' />
    <g @selector='rotorGroup'>
        <circle @selector='rotorFrame' />
        <circle @selector='rotorBackground' />
        <path @selector='rotor' />
    </g>
    <text @selector='label' />
`;

export default class Pump extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'power';
    }

    get stubLength(): number {
        return 30;
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Pump',
            size: {
                width: 100,
                height: 100
            },
            // 0 = off, 1 = on
            power: 0,
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
                label: {
                    ...labelAttributes,
                    text: 'Pump'
                },
                rotorGroup: {
                    transform: 'translate(calc(w/2),calc(h/2))'
                },
                rotorFrame: {
                    r: 40,
                    fill: 'var(--shape-metal-flat)',
                    stroke: '#666',
                    strokeWidth: 2
                },
                rotorBackground: {
                    r: 34,
                    fill: '#777',
                    stroke: '#222',
                    strokeWidth: 1
                },
                rotor: {
                    d: `M 0 0 V ${r} l ${-d} ${-l} Z M 0 0 V ${-r} l ${d} ${l} Z M 0 0 H ${r} l ${-l} ${d} Z M 0 0 H ${-r} l ${l} ${-d} Z`,
                    stroke: '#222',
                    strokeWidth: 3,
                    fill: '#bbb'
                }
            },
            // The inlet (left) low and the outlet (right) high, both on the grid of the editor
            ports: pipePorts({
                name: 'absolute',
                args: { x: 'calc(w / 2)' }
            }, [1, 0], {
                left: { y: 'calc(0.7 * h)' },
                right: { y: 'calc(0.3 * h)' }
            })
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
