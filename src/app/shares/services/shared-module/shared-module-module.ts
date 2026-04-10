import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';




@NgModule({
  declarations: [
    ],
  imports: [
    CommonModule
  ],
    exports: []  // <- important pour le rendre visible ailleurs

})
export class SharedModuleModule { }
