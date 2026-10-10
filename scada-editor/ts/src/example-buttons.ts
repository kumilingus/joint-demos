import { EXAMPLES, type Example } from './examples';

/** The buttons of the examples (see `examples.ts`): a name and a description each, `onPick` on a click */
export function createExampleButtons(onPick: (example: Example) => void): HTMLButtonElement[] {
    return EXAMPLES.map((example) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'scada-example-button';
        const name = document.createElement('strong');
        name.textContent = example.name;
        const description = document.createElement('span');
        description.textContent = example.description;
        button.append(name, description);
        button.addEventListener('click', () => onPick(example));
        return button;
    });
}
