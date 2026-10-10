import type { App } from '../app';
import { createExampleButtons } from '../example-buttons';
import { openExample } from '../actions';
import { toggleSettings } from './settings';

/*
 * The placeholder of the inspector panel: what it says while it has nothing else - a shape to select, the diagram settings, the
 * examples to open.
 */

/** The placeholder in the inspector panel: shown while it has nothing else (see `inspector/inspector.css`) */
export function showInspectorPlaceholder(app: App): void {
    app.inspectorEl.append(createInspectorPlaceholder(app));
}

/**
 * What the placeholder of the inspector panel says (shown while it has nothing else, see `inspector/inspector.css`): with
 * a way to the settings
 */
function createInspectorPlaceholder(app: App): HTMLElement {
    const el = document.createElement('div');
    el.className = 'scada-inspector-placeholder';
    // Two ways: a shape, or (an "or" between them) the settings with what they have
    const text = document.createElement('p');
    text.textContent = 'Select a shape on the canvas or in the palette to see its properties.';
    const or = document.createElement('div');
    or.className = 'scada-inspector-placeholder-or';
    or.textContent = 'or';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Diagram settings';
    button.addEventListener('click', () => toggleSettings(app));
    const caption = document.createElement('p');
    caption.className = 'scada-inspector-placeholder-caption';
    caption.textContent = 'the screen, the animations, the editor';
    el.append(text, or, button, caption, createExamples(app));
    return el;
}

/** The example diagrams to open (see `examples.ts`) */
function createExamples(app: App): HTMLElement {
    const el = document.createElement('div');
    el.className = 'scada-inspector-examples';
    const title = document.createElement('h2');
    title.textContent = 'Examples';
    el.append(title, ...createExampleButtons(example => openExample(app, example)));
    return el;
}
