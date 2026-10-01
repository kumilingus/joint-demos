import { dia, highlighters } from '@joint/plus';
import { cellNamespace } from './shapes';
import { createGraph } from './layers';
import { getFootprint } from './shapes/footprint';
import { descriptions } from './descriptions';
import { getImages, IMAGES_ATTRIBUTE, type ImagesPaperOptions } from './images';
import { SELECTION_COLOR } from './const';
import type { App } from './app';
import { deleteImage, refreshPalette } from './actions';
import { isFavorite, toggleFavorite } from './favorites';
import { paletteKey } from './stencil';
import { Animations } from './animations';

/*
 * A shape of the palette clicked (not dragged): shown in the inspector panel with what it is,
 * on a paper of its own. An image of the user can be renamed there.
 */

const PREVIEW_WIDTH = 240;
const PREVIEW_HEIGHT = 180;
const PREVIEW_PADDING = 20;

const PALETTE_HIGHLIGHTER_ID = 'palette-selection';

interface Shown {
    el: HTMLElement;
    paper: dia.Paper;
    cellView: dia.CellView;
    animations: Animations;
}

let shown: Shown | null = null;

/** Show the shape of the palette (its view in the palette is outlined). */
export function showShapePreview(app: App, cellView: dia.CellView): void {
    closeShapePreview();
    const cell = cellView.model;
    const type = cell.get('type');
    const { title, description } = descriptions[type] ?? { title: type, description: '' };

    const el = document.createElement('div');
    el.className = 'palette-shape';
    const previewEl = document.createElement('div');
    previewEl.className = 'palette-shape-preview';
    const titleEl = document.createElement('h3');
    titleEl.className = 'palette-shape-title';
    titleEl.textContent = title;
    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'palette-shape-description';
    descriptionEl.textContent = description;
    const actionsEl = document.createElement('div');
    actionsEl.className = 'palette-shape-actions';
    actionsEl.append(createFavoriteButton(app, paletteKey(cell)));
    el.append(previewEl, titleEl, descriptionEl, actionsEl);

    app.inspectorEl.append(el);

    const paper = new dia.Paper({
        el: previewEl,
        model: createGraph(),
        cellViewNamespace: cellNamespace,
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
        interactive: false,
        background: { color: 'transparent' },
        getImages: () => getImages(app.graph)
    } as dia.Paper.Options & ImagesPaperOptions);
    const copy = cell.clone();
    // A link without its name (the label of the palette, see `setTooltip()` in `stencil.ts`): the title says it.
    if (copy.isLink()) copy.labels([]);
    // Shown running (see `animations.ts`): switched on, open
    if (copy.has('power')) copy.set('power', 1);
    const open = copy.get('open');
    if (typeof open === 'boolean') copy.set('open', true);
    if (typeof open === 'number') copy.set('open', 1);
    paper.model.addCell(copy);
    // The paper renders the shape at once (not async): its view is there to be animated.
    const animations = new Animations(paper);
    animations.start();

    // An image of the user: named after it, the name can be changed (the label of the elements dropped from now on).
    const imageId: string | undefined = cell.attr('image/imageId');
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
    shown = { el, paper, cellView, animations };
}

export function closeShapePreview(): void {
    if (!shown) return;
    shown.animations.stop();
    highlighters.mask.remove(shown.cellView, PALETTE_HIGHLIGHTER_ID);
    shown.paper.remove();
    shown.el.remove();
    shown = null;
}

/** The name of the image in the diagram (the palette shows it under the image). */
function createNameField(app: App, imageId: string, onRename: (name: string) => void): HTMLElement {
    const label = document.createElement('label');
    label.className = 'palette-shape-field';
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
    button.className = 'palette-shape-button favorite';
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
    button.className = 'palette-shape-button danger';
    button.textContent = 'Delete image';
    button.addEventListener('click', () => {
        deleteImage(app, imageId);
    });
    return button;
}
