import { root } from '../util/root';
export function getSymbolObservable(context) {
    var $$observable;
    var Symbol = context.Symbol;
    if (typeof Symbol === 'function') {
        if (Symbol.observable) {
            $$observable = Symbol.observable;
        }
        else {
            $$observable = Symbol('observable');
            Symbol.observable = $$observable;
        }
    }
    else {
        $$observable = '@@observable';
    }
    return $$observable;
}
export var observable = getSymbolObservable(root);
/**
 * @deprecated use observable instead
 */
export var $$observable = observable;
//# sourceMappingURL=observable.js.map