import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';

/**
 * The elements showing the images of the user follow the images of the diagram: an image that comes back
 * (an undo of a delete) replaces the placeholder, a deleted one is replaced by it. Active in every mode.
 */
export default class ImagesController extends Controller {

    startListening(): void {
        this.listenTo(this.context.graph, 'change:images', onImagesChange);
    }
}

function onImagesChange(app: App) {
    const { graph, paper } = app;
    graph.getElements()
        .filter(element => element.get('type') === 'CustomImage')
        .forEach((element) => {
            const view = element.findView(paper) as dia.ElementView | undefined;
            view?.requestUpdate(view.getFlag('UPDATE'));
        });
}
