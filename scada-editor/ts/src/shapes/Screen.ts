import { dia, util, V } from '@joint/plus';
import { Layer } from '../const';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <text @selector='label' />
`;

/**
 * The area of the diagram the runtime mode shows, fitted to the canvas (see `screen.ts`):
 * a frame under everything (a guide: not in the runtime mode). A diagram has one at most, added and edited
 * in the settings (see `settings.ts`). It lets the pointer through unless the settings are open.
 */
export default class Screen extends dia.Element {

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Screen',
            layer: Layer.Background,
            // Under the other shapes of the background (the logo, ...)
            z: -1000,
            size: {
                // Full HD
                width: 1920,
                height: 1080
            },
            attrs: {
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    // Grabbed anywhere while it is edited (the pointer passes through it otherwise)
                    fill: 'transparent',
                    // The frame is shown while editing only (see `styles.css`).
                    stroke: 'var(--shape-screen)',
                    strokeWidth: 2,
                    strokeDasharray: '8 4',
                    // The canvas is panned across it, its shapes selected (unless it is edited, `.screen-editable` in `styles.css`)
                    pointerEvents: 'none'
                },
                label: {
                    // The name and the size: `Screen 1920 × 1080`
                    sizeLabel: 'Screen',
                    x: 0,
                    y: -8,
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fill: 'var(--shape-screen)',
                    pointerEvents: 'none'
                }
            }
        };
    }

    static attributes = {
        // The name followed by the size of the element (`sizeLabel` in the attributes: the names
        // are looked up in the kebab case), written again when it is resized.
        'size-label': {
            set(this: dia.ElementView, name: string, refBBox: dia.BBox, node: Element) {
                V(node as SVGElement).text(`${name} ${Math.round(refBBox.width)} × ${Math.round(refBBox.height)}`, { textVerticalAnchor: 'bottom' });
                return {};
            },
            unset(this: dia.ElementView, node: Element) {
                node.textContent = '';
            }
        }
    };

    preinitialize(): void {
        this.markup = markup;
    }
}
