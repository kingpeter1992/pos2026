import { Component, Inject, Injectable } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialogconfirm',
  templateUrl: './dialogconfirm.html',
  styleUrl: './dialogconfirm.css',
  standalone :false
})


export class Dialogconfirm {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

}
