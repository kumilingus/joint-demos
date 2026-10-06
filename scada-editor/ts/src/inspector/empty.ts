import type { App } from '../app';
import { EXAMPLES } from '../examples';
import { openExample } from '../actions';
import { toggleSettings } from './settings';

/*
 * The empty inspector panel: what it says while it has nothing else - a shape to select, the diagram settings, the
 * examples to open.
 */

/** The empty state in the inspector panel: shown while it has nothing else (see `inspector/inspector.css`) */
export function showInspectorEmpty(app: App): void {
    app.inspectorEl.append(createInspectorEmpty(app));
}

/** What the empty inspector panel says (shown while it has nothing else, see `inspector/inspector.css`): with a way to the settings */
function createInspectorEmpty(app: App): HTMLElement {
    const el = document.createElement('div');
    el.className = 'scada-inspector-empty';
    // Two ways: a shape, or (an "or" between them) the settings with what they have
    const text = document.createElement('p');
    text.textContent = 'Select a shape on the canvas or in the palette to see its properties.';
    const or = document.createElement('div');
    or.className = 'scada-inspector-empty-or';
    or.textContent = 'or';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Diagram settings';
    button.addEventListener('click', () => toggleSettings(app));
    const caption = document.createElement('p');
    caption.className = 'scada-inspector-empty-caption';
    caption.textContent = 'the screen, the animations, the editor';
    el.append(text, or, button, caption, createExamples(app));
    return el;
}

/** The example diagrams to open (see `examples.ts`) */
function createExamples(app: App): HTMLElement {
    const el = document.createElement('div');
    el.className = 'scada-inspector-examples';
    const title = document.createElement('h4');
    title.textContent = 'Examples';
    el.append(title);
    EXAMPLES.forEach((example) => {
        const button = document.createElement('button');
        button.type = 'button';
        const name = document.createElement('strong');
        name.textContent = example.name;
        const description = document.createElement('span');
        description.textContent = example.description;
        button.append(name, description);
        button.addEventListener('click', () => openExample(app, example));
        el.append(button);
    });
    return el;
}
