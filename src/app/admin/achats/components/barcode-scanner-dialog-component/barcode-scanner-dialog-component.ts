import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';

@Component({
  selector: 'app-barcode-scanner-dialog-component',
  templateUrl: './barcode-scanner-dialog-component.html',
  styleUrl: './barcode-scanner-dialog-component.css',
  standalone: false
})
export class BarcodeScannerDialogComponent  implements AfterViewInit, OnDestroy {

  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  isLoading = true;
  hasCamera = true;
  scanError = '';
  scannedValue = '';
  scanning = false;

  private codeReader!: BrowserMultiFormatReader;
  private controls?: IScannerControls;
  private stream?: MediaStream;

  constructor(
    private dialogRef: MatDialogRef<BarcodeScannerDialogComponent>
  ) {}

 ngAfterViewInit(): void {
  queueMicrotask(() => this.initScanner());
}

  async initScanner(): Promise<void> {
  this.isLoading = true;
  this.scanError = '';
  this.scannedValue = '';

  try {
    if (!this.videoRef?.nativeElement) {
      this.scanError = 'Zone vidéo introuvable.';
      this.isLoading = false;
      return;
    }

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E
    ]);

    this.codeReader = new BrowserMultiFormatReader(hints);
    this.scanning = true;

    const devices = await BrowserMultiFormatReader.listVideoInputDevices();

    if (!devices || devices.length === 0) {
      this.hasCamera = false;
      this.scanError = 'Aucune caméra détectée sur cet appareil.';
      this.isLoading = false;
      this.scanning = false;
      return;
    }

    const selectedDeviceId = devices[0].deviceId;

    this.controls = await this.codeReader.decodeFromVideoDevice(
      selectedDeviceId,
      this.videoRef.nativeElement,
      (result, error) => {
        if (result) {
          const barcode = result.getText()?.trim();
          if (barcode) {
            this.scannedValue = barcode;
            this.stopScanner();
            this.dialogRef.close(barcode);
          }
        }

        if (error && !(error instanceof NotFoundException)) {
          console.error('Erreur scan code-barres:', error);
        }
      }
    );

    const video = this.videoRef.nativeElement;
    this.stream = video.srcObject as MediaStream;

    this.isLoading = false;
  } catch (error) {
    console.error('Erreur initialisation scanner:', error);
    this.hasCamera = false;
    this.scanError = 'Impossible d’accéder à la caméra.';
    this.isLoading = false;
    this.scanning = false;
  }
}
  retry(): void {
    this.stopScanner();
    this.initScanner();
  }

  cancel(): void {
    this.stopScanner();
    this.dialogRef.close(null);
  }

  private stopScanner(): void {
    this.scanning = false;

    try {
      this.controls?.stop();
    } catch (e) {
      console.warn('Erreur stop controls', e);
    }

    try {
      if (this.codeReader) {
        this.codeReader = null as any;
      }
    } catch (e) {
      console.warn('Erreur reset codeReader', e);
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }
}
