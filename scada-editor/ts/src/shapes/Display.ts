import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { Layer, LIQUID_COLOR } from '../const';
import Shape from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='screen' />
    <text @selector='value' />
    <text @selector='unit' />
    <text @selector='label' />
`;

/** A panel display showing a value with its unit. */
export default class Display extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get rotatable(): boolean {
        return false;
    }

    get tagPrefix(): string {
        return 'DI';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Display',
            size: {
                width: 120,
                height: 60
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 6,
                    ry: 6,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'plate'
                },
                screen: {
                    x: 6,
                    y: 6,
                    width: 'calc(w - 12)',
                    height: 'calc(h - 12)',
                    rx: 3,
                    ry: 3,
                    fill: '#1e272e',
                    stroke: '#111',
                    strokeWidth: 1
                },
                // The texts grow with the height of the display (a `calc()` takes a single
                // variable, so the unit is in the corner rather than next to the value).
                value: {
                    text: '42.7',
                    x: 'calc(w / 2)',
                    y: 'calc(0.42 * h)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 'calc(0.48 * h)',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    fill: LIQUID_COLOR
                },
                unit: {
                    text: 'bar',
                    x: 'calc(w - 12)',
                    y: 'calc(h - 9)',
                    textAnchor: 'end',
                    textVerticalAnchor: 'bottom',
                    fontSize: 'calc(0.2 * h)',
                    fontFamily: 'sans-serif',
                    fill: LIQUID_COLOR,
                    fillOpacity: 0.8
                },
                label: {
                    ...labelAttributes,
                    text: 'Display'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
