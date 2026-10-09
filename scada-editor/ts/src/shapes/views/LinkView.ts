import { dia } from '@joint/plus';
import { routingPresentationAttributes } from '../common/routing';

/** The view of a link drawn again when its style (its colors, its size) or its routing changes (see `style.ts`, `routing.ts`) */
const LinkView = dia.LinkView.extend({
    presentationAttributes: dia.LinkView.addPresentationAttributes({
        style: dia.LinkView.Flags.UPDATE,
        ...routingPresentationAttributes
    })
});

export default LinkView;
