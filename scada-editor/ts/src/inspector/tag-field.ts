import { dia, type ui } from '@joint/plus';
import type TagIndex from '../plant/TagIndex';
import { isTaggable, nextTag } from '../plant/tags';
import { renderLabel } from './help';

/*
 * The ID field of the inspector (the tag of a cell, see `plant/tags.ts`): optional - empty, the cell is not bound to the
 * plant. While it is empty, a button generates the next free ID of the series of the shape; not with an ID (a tag in use
 * is not renumbered by a click).
 */

/**
 * The content of the ID field (the `renderFieldContent` of the inspector): its text input, saved by the inspector as its
 * own (it has the attribute and the type), and the button generating an ID. `undefined` for the other fields.
 */
export function renderTagField(
    tags: TagIndex,
    options: { label?: string },
    path: string,
    value: unknown,
    inspector: ui.Inspector
): HTMLElement | undefined {
    const { cell } = inspector.options;
    if (path !== 'tag' || !(cell instanceof dia.Cell)) return undefined;
    const el = document.createElement('div');
    el.className = 'scada-tag-field';
    const label = renderLabel(options, path) ?? document.createElement('label');
    if (!label.textContent) label.textContent = options.label ?? path;
    const input = document.createElement('input');
    input.type = 'text';
    input.dataset.attribute = path;
    input.dataset.type = 'text';
    input.placeholder = 'None';
    input.value = typeof value === 'string' ? value : '';
    const row = document.createElement('div');
    row.className = 'scada-tag-field-row';
    row.append(input);
    // Its shape has a series of IDs (a text, a zone has none)
    if (isTaggable(cell)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'scada-tag-generate';
        button.textContent = 'Generate';
        button.dataset.tooltip = 'The next free ID of its kind';
        const showButton = () => {
            button.hidden = input.value.trim() !== '';
        };
        showButton();
        input.addEventListener('input', showButton);
        // As typed: the inspector saves it (one step of the history)
        button.addEventListener('click', () => {
            input.value = nextTag(tags, cell);
            input.dispatchEvent(new Event('change', { bubbles: true }));
            showButton();
        });
        row.append(button);
    }
    el.append(label, row);
    return el;
}
