import type { ui } from '@joint/plus';

/**
 * The tooltips of the app: of every element with the `data-tooltip` attribute (the toolbar buttons,
 * the shapes of the palette, the help of the inspector, ...) - below it, unless it says where (its
 * `data-tooltip-position`, see `besidePanel()`).
 */
export const tooltipOptions: Partial<ui.Tooltip.Options> = {
    rootTarget: document.body,
    target: '[data-tooltip]',
    padding: 8,
    // Shown after a while (not while the pointer passes over), fading in
    animation: { delay: '400ms', duration: '150ms', timingFunction: 'ease-out' },
    direction: 'auto' as ui.Tooltip.Options['direction'],
    // Below it (its arrow on its top: the position is of the arrow), unless it says where - an option overrides the
    // attributes of the element: none returned, they apply
    position: (element: Element) => (element.hasAttribute('data-tooltip-position') ? undefined : 'top') as ui.Tooltip.TooltipPosition
};

/**
 * The attributes of an element with its tooltip outside of its panel, at its height: on the right of the palette (the
 * arrow on its left), on the left of the inspector - not over the panel.
 */
export function besidePanel(panel: 'palette' | 'inspector'): Record<string, string> {
    return panel === 'palette'
        ? { 'data-tooltip-position': 'left', 'data-tooltip-position-selector': '.stencil-panel' }
        : { 'data-tooltip-position': 'right', 'data-tooltip-position-selector': '.inspector-panel' };
}

/** Set the attributes on the element (see `besidePanel()`) */
export function setBesidePanel(el: HTMLElement, panel: 'palette' | 'inspector'): void {
    Object.entries(besidePanel(panel)).forEach(([name, value]) => el.setAttribute(name, value));
}
