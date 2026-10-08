import type { dia } from '@joint/plus';
import Wire from '../../shapes/models/electrical/Wire';
import { dataOf } from '../../shapes/common/data';

/*
 * The electrical circuits of the mock plant: which elements and wires are energized (a real plant sends it
 * with its data, as the `energized` of the cells, see `ElectricalController`). The power comes
 * from the sources (a running generator or wind turbine, a battery, a solar array) through the wires and every element on the way,
 * but an open breaker or disconnector: it is energized itself (on its side of the source),
 * what is behind it is not.
 */

/** Whether the element is a source of the power now */
function isSource(element: dia.Element): boolean {
    const type = element.get('type');
    if (['Battery', 'BatteryBank', 'SolarArray'].includes(type)) {
        return true;
    }
    if (['Generator', 'DieselGenerator', 'WindTurbine'].includes(type)) {
        return Boolean(dataOf(element, 'power'));
    }
    return false;
}

/** Whether the current passes the element (to its other terminals) */
function isPassing(element: dia.Element): boolean {
    const type = element.get('type');
    if (type === 'CircuitBreaker' || type === 'Disconnector') {
        return !dataOf(element, 'open');
    }
    return true;
}

/** The energized elements and wires of the diagram */
export function getEnergized(graph: dia.Graph): Set<dia.Cell> {
    const reached = new Set<dia.Element>();
    const queue = graph.getElements().filter(isSource);
    queue.forEach(element => reached.add(element));
    for (let element = queue.shift(); element; element = queue.shift()) {
        if (!isPassing(element)) {
            continue;
        }
        graph.getConnectedLinks(element).forEach((link) => {
            if (!(link instanceof Wire)) {
                return;
            }
            [link.getSourceElement(), link.getTargetElement()].forEach((end) => {
                if (!end || reached.has(end)) {
                    return;
                }
                reached.add(end);
                queue.push(end);
            });
        });
    }
    const energized = new Set<dia.Cell>(reached);
    graph.getLinks().forEach((link) => {
        if (!(link instanceof Wire)) {
            return;
        }
        const [source, target] = [link.getSourceElement(), link.getTargetElement()];
        if (source && target && reached.has(source) && reached.has(target)) {
            energized.add(link);
        }
    });
    return energized;
}
