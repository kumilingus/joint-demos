import { dia, ui, util } from '@joint/plus';
import { paperOptions } from './config';
import { routingPaperOptions, routingPresentationAttributes } from '../shapes/common/routing';

/*
 * The minimap. Its views are simplified: an element is a plain rectangle (the screen a tinted frame),
 * a pipe is a single line (no outline, no pipe stubs, no labels).
 */

const UpdateFlags = {
    Render: '@render',
    Update: '@update',
    Transform: '@transform'
};

const ELEMENT_FILL = '#a7b0b8';

const NavigatorElementView = dia.ElementView.extend({
    body: null,
    markup: util.svg`<rect @selector="body" rx="4" ry="4" />`,
    initFlag: [UpdateFlags.Render, UpdateFlags.Update, UpdateFlags.Transform],
    presentationAttributes: {
        position: [UpdateFlags.Transform],
        angle: [UpdateFlags.Transform],
        size: [UpdateFlags.Update]
    },
    confirmUpdate: function(flags: number) {
        if (this.hasFlag(flags, UpdateFlags.Render)) this.render();
        if (this.hasFlag(flags, UpdateFlags.Update)) this.update();
        if (this.hasFlag(flags, UpdateFlags.Transform)) this.updateTransformation();
        return 0;
    },
    render: function() {
        const doc = util.parseDOMJSON(this.markup);
        this.body = doc.selectors.body;
        if (this.model.get('type') === 'Screen') {
            // In the color of the screen on the canvas, tinted (see `canvas.css`): what the runtime mode shows
            this.body.setAttribute('class', 'scada-navigator-screen');
        } else if (this.model.get('type') === 'Group') {
            // Nothing of it is drawn (see `Group`): its members are.
            this.body.setAttribute('fill', 'none');
        } else {
            this.body.setAttribute('fill', ELEMENT_FILL);
        }
        this.el.appendChild(doc.fragment);
        this.update();
        return this;
    },
    update: function() {
        const { model, body } = this;
        if (!body) return;
        const { width, height } = model.size();
        body.setAttribute('width', String(width));
        body.setAttribute('height', String(height));
    }
});

const navigatorLinkMarkup = util.svg`<path @selector="line" fill="none" />`;

/** A pipe drawn by its `line` only (its color and width come from the model). */
const NavigatorLinkView = dia.LinkView.extend({
    presentationAttributes: dia.LinkView.addPresentationAttributes(routingPresentationAttributes),
    renderMarkup: function() {
        this.renderJSONMarkup(navigatorLinkMarkup);
    }
});

export function createNavigator(el: HTMLElement, scroller: ui.PaperScroller): ui.Navigator {
    const navigator = new ui.Navigator({
        el,
        paperScroller: scroller,
        width: 220,
        height: 150,
        padding: 10,
        zoom: false,
        // Frame the diagram (not the whole paper), so that it is readable.
        useContentBBox: { useModelGeometry: true },
        // The minimap takes in the visible area too (when it reaches out of the diagram).
        dynamicZoom: true,
        paperOptions: {
            async: true,
            elementView: NavigatorElementView,
            linkView: NavigatorLinkView,
            // The ends of the pipes as on the canvas: from the models (the ports are not drawn here)
            defaultAnchor: paperOptions.defaultAnchor,
            defaultConnectionPoint: paperOptions.defaultConnectionPoint,
            ...routingPaperOptions,
            anchorNamespace: paperOptions.anchorNamespace,
            background: { color: 'transparent' }
        }
    });
    navigator.render();
    return navigator;
}
