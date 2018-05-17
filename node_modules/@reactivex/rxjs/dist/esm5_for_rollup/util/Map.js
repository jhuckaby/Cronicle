import { root } from './root';
import { MapPolyfill } from './MapPolyfill';
export var Map = root.Map || (function () { return MapPolyfill; })();
//# sourceMappingURL=Map.js.map