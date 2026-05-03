import {
  MatTooltip,
  TooltipComponent
} from "./chunk-EKD5FLKM.js";
import {
  OverlayModule
} from "./chunk-KBLAAOTP.js";
import {
  CdkScrollableModule
} from "./chunk-XYJCA6GQ.js";
import {
  A11yModule
} from "./chunk-V3ZTOXXN.js";
import {
  BidiModule
} from "./chunk-QTIHG4Q3.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineNgModule
} from "./chunk-FKCUFCP6.js";
import {
  ɵɵdefineInjector
} from "./chunk-KDX5GZJX.js";

// node_modules/@angular/material/fesm2022/tooltip.mjs
var MatTooltipModule = class _MatTooltipModule {
  static ɵfac = function MatTooltipModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatTooltipModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatTooltipModule,
    imports: [A11yModule, OverlayModule, MatTooltip, TooltipComponent],
    exports: [MatTooltip, TooltipComponent, BidiModule, CdkScrollableModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [A11yModule, OverlayModule, BidiModule, CdkScrollableModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTooltipModule, [{
    type: NgModule,
    args: [{
      imports: [A11yModule, OverlayModule, MatTooltip, TooltipComponent],
      exports: [MatTooltip, TooltipComponent, BidiModule, CdkScrollableModule]
    }]
  }], null, null);
})();

export {
  MatTooltipModule
};
//# sourceMappingURL=chunk-5DWXLYBR.js.map
