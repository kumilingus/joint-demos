import { dia } from '@joint/plus';
import { CANVAS_COLOR } from '../const';

/**
 * A view of a shape rendered again when the attributes of its model change (their special attributes
 * read them): the color, the finish and the outline of its surfaces (see `surfaceAttributes`), the data of a chart, ...
 */
export function shapeView(attributes: string[] = []): typeof dia.ElementView {
    return dia.ElementView.extend({
        // The surfaces in the color of the canvas marked on the root: the ink on them follows it
        // (see `--shape-surface-ink` in `shapes.css`)
        update(this: dia.ElementView, ...args: unknown[]) {
            (dia.ElementView.prototype.update as (...updateArgs: unknown[]) => void).apply(this, args);
            this.el.toggleAttribute('data-canvas', this.model.get('color') === CANVAS_COLOR);
        },
        presentationAttributes: dia.ElementView.addPresentationAttributes(
            {
                // The surfaces of the element and of its pipe stubs (ports)
                color: [dia.ElementView.Flags.UPDATE, dia.ElementView.Flags.PORTS],
                finish: [dia.ElementView.Flags.UPDATE, dia.ElementView.Flags.PORTS],
                outline: [dia.ElementView.Flags.UPDATE, dia.ElementView.Flags.PORTS],
                // Rotated: its label laid out again (horizontal, on its side - see `labelPosition`)
                angle: [dia.ElementView.Flags.ROTATE, dia.ElementView.Flags.UPDATE],
                ...Object.fromEntries(attributes.map(attribute => [attribute, dia.ElementView.Flags.UPDATE]))
            }
        )
    });
}

/** The view of the shapes without a view of their own (see `elementView` in `config.ts`) */
const ShapeView = shapeView();

export default ShapeView;
