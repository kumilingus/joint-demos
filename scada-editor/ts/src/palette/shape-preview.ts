import { dia, highlighters } from '@joint/plus';
import { propertiesOf, readProperty, writeProperty } from '../plant/properties';
import { cellNamespace } from '../shapes';
import { createGraph } from '../canvas/layers';
import { getFootprint } from '../shapes/common/footprint';
import { descriptions } from './descriptions';
import { getImages, IMAGES_ATTRIBUTE } from './images';
import { SELECTION_COLOR } from '../const';
import type { App } from '../app';
import { deleteImage, refreshPalette } from '../actions';
import { isFavorite, toggleFavorite } from './favorites';
import { paletteKey } from './stencil';
import { Animations, getAnimationLevel } from '../runtime/animations';
import { dataOf, hasData, setData } from '../shapes/common/data';
import { routingPaperOptions } from '../shapes/common/routing';
import { type PanelContent, showInPanel } from '../inspector/panel';

/*
 * A shape of the palette clicked (not dragged): shown in the inspector panel with what it is,
 * on a paper of its own - as in the runtime mode: animated, switched on and off, its reading going up and down
 * (see `previewState()`).
 * An image of the user can be renamed there.
 */

// The height of the preview (its width: of the panel)
const PREVIEW_HEIGHT = 180;
const PREVIEW_PADDING = 20;

const PALETTE_HIGHLIGHTER_ID = 'palette-selection';
const ENERGIZED_HIGHLIGHTER_ID = 'energized';

// How long the shape stays on, and off, in the preview (ms)
const STATE_INTERVAL = 2500;

// The shapes drawn differently while energized (see `runtime.css`): the others show nothing of it
const ENERGIZED_TYPES = ['Wire', 'Lamp', 'Switchgear', 'MotorControlCenter', 'Heater'];

// The shapes with a value on a scale (0 - 100: a gauge, a thermometer)
const SCALED_TYPES = ['PressureGauge', 'Thermometer'];

/**
 * A state of the shape the preview switches (on and off, or two values): set, the caption of an on / off state returned
 * (none of a value: the shape shows it)
 */
type PreviewState = (cell: dia.Cell, view: dia.CellView, on: boolean) => string | null;

/**
 * The state of the shape shown in the preview, if it has one: running, open, energized (an electrical part drawn so),
 * or a reading of the plant (a level, a value) going up and down
 */
function previewState(cell: dia.Cell): PreviewState | null {
    if (hasData(cell, 'power')) {
        return (c, _view, on) => {
            setData(c, 'power', on ? 1 : 0);
            return on ? 'Running' : 'Stopped';
        };
    }
    const open = dataOf(cell, 'open');
    if (typeof open === 'boolean' || typeof open === 'number') {
        return (c, _view, on) => {
            setData(c, 'open', typeof open === 'boolean' ? on : Number(on));
            return on ? 'Open' : 'Closed';
        };
    }
    if (ENERGIZED_TYPES.includes(cell.get('type'))) {
        // The class of a live circuit (as in the runtime mode, see `ElectricalController`)
        return (_cell, view, on) => {
            highlighters.addClass.remove(view, ENERGIZED_HIGHLIGHTER_ID);
            if (on) highlighters.addClass.add(view, 'root', ENERGIZED_HIGHLIGHTER_ID, { className: 'energized' });
            return on ? 'Energized' : 'Off';
        };
    }
    // A reading (see `plant/properties.ts`): between two values - of a scale (0 - 100), or around the one it shows (by a tenth)
    if (!cell.isElement()) return null;
    const element = cell;
    const property = propertiesOf(element).find(name => typeof readProperty(element, name) === 'number');
    if (!property) return null;
    const shown = Number(readProperty(element, property)) || 50;
    const scale = property === 'level' || SCALED_TYPES.includes(element.get('type'));
    const values = scale ? [75, 25] : [shown * 1.1, shown * 0.9].map(value => Number(value.toFixed(1)));
    return (_cell, _view, on) => {
        writeProperty(element, property, values[on ? 0 : 1]);
        return null;
    };
}

/** The shape of the palette in the inspector panel: its paper, its animations, its state changing (see `showShapePreview()`) */
class ShapePreview implements PanelContent {

    el: HTMLElement;
    /** The view of the shape in the palette: outlined while it is shown */
    cellView: dia.CellView;
    paper: dia.Paper | null = null;
    animations: Animations | null = null;
    timer: number | null = null;

    constructor(el: HTMLElement, cellView: dia.CellView) {
        this.el = el;
        this.cellView = cellView;
    }

    remove(): void {
        if (this.timer !== null) window.clearInterval(this.timer);
        this.animations?.stop();
        highlighters.mask.remove(this.cellView, PALETTE_HIGHLIGHTER_ID);
        this.paper?.remove();
        this.el.remove();
    }
}

/** Show the shape of the palette in the inspector panel (its view in the palette is outlined). */
export function showShapePreview(app: App, cellView: dia.CellView): void {
    const cell = cellView.model;
    const type = cell.get('type');
    const { title, description } = descriptions[type] ?? { title: type, description: '' };

    const el = document.createElement('div');
    el.className = 'scada-palette-shape';
    const previewEl = document.createElement('div');
    previewEl.className = 'scada-palette-shape-preview';
    const titleEl = document.createElement('h3');
    titleEl.className = 'scada-palette-shape-title';
    titleEl.textContent = title;
    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'scada-palette-shape-description';
    descriptionEl.textContent = description;
    const actionsEl = document.createElement('div');
    actionsEl.className = 'scada-palette-shape-actions';
    actionsEl.append(createFavoriteButton(app, paletteKey(cell)));
    const stateEl = document.createElement('div');
    stateEl.className = 'scada-palette-shape-state';
    el.append(previewEl, stateEl, titleEl, descriptionEl, actionsEl);

    // In the panel before its paper: as wide as the panel
    const preview = new ShapePreview(el, cellView);
    showInPanel(app, preview);

    const paper = preview.paper = new dia.Paper({
        el: previewEl,
        model: createGraph(),
        cellViewNamespace: cellNamespace,
        // The links by their routing (see `routing.ts`)
        ...routingPaperOptions,
        // As wide as the panel (without its border)
        width: previewEl.clientWidth,
        height: PREVIEW_HEIGHT,
        interactive: false,
        background: { color: 'transparent' },
        getImages: () => getImages(app.graph)
    });
    const copy = cell.clone();
    // A link without its name (the label of the palette, see `setTooltip()` in `stencil.ts`): the title says it.
    if (copy.isLink()) copy.labels([]);
    paper.model.addCell(copy);
    // The paper renders the shape at once (not async): its view is there to be animated.
    const view = copy.findView(paper);
    const animations = preview.animations = new Animations(paper);
    // As much as the diagram moves (the alarms only: switched still); less if the system asks for less motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    animations.level = reducedMotion ? 'alarms' : getAnimationLevel(app.graph);
    // Shown on (running, open, energized), then off and on again - a change of the state (as the level of the diagram
    // allows: what moves on its own while it is on is the animations' level)
    const state = previewState(copy);
    let on = true;
    const show = () => {
        if (!state) return;
        stateEl.textContent = state(copy, view, on) ?? '';
        stateEl.classList.toggle('on', on);
        // A level, a charge, a column glide to the new value by their views (as in the runtime mode, see `glide.ts`)
        animations.animate(copy);
    };
    show();
    animations.start();
    if (state) {
        preview.timer = window.setInterval(() => {
            on = !on;
            show();
        }, STATE_INTERVAL);
    }

    // An image of the user: named after it, the name can be changed (the label of the elements dropped from now on).
    const imageId: string | undefined = cell.get('imageId');
    if (imageId) {
        titleEl.textContent = getImages(app.graph)[imageId]?.name ?? title;
        el.insertBefore(createNameField(app, imageId, (name) => {
            // The title (the label of the shape is not shown here)
            titleEl.textContent = name;
        }), actionsEl);
        actionsEl.append(createDeleteButton(app, imageId));
    }
    // Fitted to what the shape draws (its pipe stubs, ...; not its label, hidden as in the palette), from the model
    paper.transformToFitContent({ contentArea: getFootprint(copy, { label: false }), padding: PREVIEW_PADDING, maxScale: 1.5, verticalAlign: 'middle', horizontalAlign: 'middle' });

    highlighters.mask.add(cellView, 'root', PALETTE_HIGHLIGHTER_ID, {
        padding: 4,
        attrs: { stroke: SELECTION_COLOR, strokeWidth: 2, strokeLinejoin: 'round' }
    });
}

/** The name of the image in the diagram (the palette shows it under the image). */
function createNameField(app: App, imageId: string, onRename: (name: string) => void): HTMLElement {
    const label = document.createElement('label');
    label.className = 'scada-palette-shape-field';
    label.textContent = 'Name';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = getImages(app.graph)[imageId]?.name ?? '';
    input.addEventListener('change', () => {
        const images = getImages(app.graph);
        const name = input.value.trim();
        if (!images[imageId] || !name) {
            input.value = images[imageId]?.name ?? '';
            return;
        }
        onRename(name);
        app.graph.set(IMAGES_ATTRIBUTE, { ...images, [imageId]: { ...images[imageId], name }});
    });
    label.append(input);
    return label;
}

/** Mark the shape as a favorite (the Favorites group of the palette), or not anymore. */
function createFavoriteButton(app: App, key: string): HTMLElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scada-palette-shape-button favorite';
    const update = () => {
        const favorite = isFavorite(app.graph, key);
        button.classList.toggle('active', favorite);
        button.textContent = favorite ? 'Favorite' : 'Add to favorites';
        button.setAttribute('aria-pressed', String(favorite));
    };
    update();
    button.addEventListener('click', () => {
        toggleFavorite(app.graph, key);
        update();
        refreshPalette(app);
    });
    return button;
}

/** Delete the image of the user: from the palette and from the diagram (see `deleteImage()`). */
function createDeleteButton(app: App, imageId: string): HTMLElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scada-palette-shape-button danger';
    button.textContent = 'Delete image';
    button.addEventListener('click', () => {
        deleteImage(app, imageId);
    });
    return button;
}
