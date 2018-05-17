import { AsyncSubject } from '../AsyncSubject';
import { multicast } from './multicast';
export function publishLast() {
    return function (source) { return multicast(new AsyncSubject())(source); };
}
//# sourceMappingURL=publishLast.js.map