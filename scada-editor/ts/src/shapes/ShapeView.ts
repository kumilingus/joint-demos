import { dia } from '@joint/plus';

/**
 * A view of a shape rendered again when the attributes of its model change (their special attributes
 * read them): the color and the finish of its surfaces (see `surfaceAttributes`), the data of a chart, ...
 */
export function shapeView(attributes: string[] = []): typeof dia.ElementView {
    return dia.ElementView.extend({
        presentationAttributes: dia.ElementView.addPresentationAttributes(
            {
                // The surfaces of the element and of its pipe stubs (ports)
                color: [dia.ElementView.Flags.UPDATE, dia.ElementView.Flags.PORTS],
                finish: [dia.ElementView.Flags.UPDATE, dia.ElementView.Flags.PORTS],
                ...Object.fromEntries(attributes.map(attribute => [attribute, dia.ElementView.Flags.UPDATE]))
            }
        )
    });
}

/** The view of the shapes without a view of their own (see `elementView` in `config.ts`) */
const ShapeView = shapeView();

export default ShapeView;
