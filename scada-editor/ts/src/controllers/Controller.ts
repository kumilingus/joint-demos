import { mvc } from '@joint/plus';
import type { App } from '../app';

/**
 * The base of all controllers. The arguments passed to the constructor
 * are prepended to the arguments of every event handler.
 */
export default abstract class Controller<A extends [App, ...unknown[]] = [App]> extends mvc.Listener<A> {

    get context(): A[0] {
        return this.callbackArguments[0];
    }

    abstract startListening(): void;
}
