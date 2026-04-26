import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeCameraScanConfig
} from 'html5-qrcode';


@Component({
  selector: 'app-barcode-scanner-dialog-component',
  templateUrl: './barcode-scanner-dialog-component.html',
  styleUrl: './barcode-scanner-dialog-component.css',
  standalone: false
})
export class BarcodeScannerDialogComponent  implements AfterViewInit, OnDestroy {

  private html5QrCode?: Html5Qrcode;
  private scannerElementId = 'barcode-reader';
  private isClosing = false;
  private isStarted = false;
  private audioCtx?: AudioContext;

  loading = true;
  scanSuccess = false;
  scanError = '';
  cameraError = '';
  scannedText = '';
  cameras: Array<{ id: string; label: string }> = [];
  selectedCameraId = '';
  torchSupported = false;
  torchEnabled = false;

  constructor(
    private dialogRef: MatDialogRef<BarcodeScannerDialogComponent>,
    private ngZone: NgZone,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async ngAfterViewInit(): Promise<void> {
    await this.initScanner();
  }

  async ngOnDestroy(): Promise<void> {
    await this.stopScannerSilently();
  }

  private async initScanner(): Promise<void> {
    this.loading = true;
    this.scanError = '';
    this.cameraError = '';

    try {
      this.cameras = await Html5Qrcode.getCameras();

      if (!this.cameras?.length) {
        this.cameraError = 'Aucune caméra détectée sur cet appareil.';
        this.loading = false;
        return;
      }

      this.selectedCameraId = this.chooseBackCamera(this.cameras)?.id ?? this.cameras[0].id;

      this.html5QrCode = new Html5Qrcode(this.scannerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });

      await this.startScanner(this.selectedCameraId);
    } catch (error: any) {
      console.error('Erreur initialisation scanner', error);
      this.cameraError = this.mapCameraError(error);
      this.loading = false;
    }
  }

private async startScanner(cameraId: string): Promise<void> {
  if (!this.html5QrCode) return;

  const config: Html5QrcodeCameraScanConfig = {
    fps: 12,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      const size = Math.floor(
        Math.min(viewfinderWidth, viewfinderHeight) * 0.72
      );
      return {
        width: size,
        height: Math.floor(size * 0.55)
      };
    },
    aspectRatio: 1.7778,
    disableFlip: false
  };

  await this.html5QrCode.start(
    cameraId,
    config,
    (decodedText: string) => this.onScanSuccess(decodedText),
    (_errorMessage: string) => {
      // on ignore les erreurs de décodage répétitives
    }
  );

  this.isStarted = true;
  this.loading = false;

  try {
    const capabilities = this.html5QrCode.getRunningTrackCapabilities?.();
    this.torchSupported = !!capabilities && 'torch' in capabilities;
  } catch {
    this.torchSupported = false;
  }
}
  private onScanSuccess(decodedText: string): void {
    if (this.isClosing || this.scanSuccess) return;

    this.scanSuccess = true;
    this.scannedText = decodedText?.trim() ?? '';

    this.playBeep();

    this.ngZone.run(async () => {
      await this.stopScannerSilently();
      this.dialogRef.close(this.scannedText);
    });
  }

  async changeCamera(cameraId: string): Promise<void> {
    if (!cameraId || cameraId === this.selectedCameraId) return;

    this.loading = true;
    this.selectedCameraId = cameraId;

    try {
      await this.stopScannerSilently();
      this.html5QrCode = new Html5Qrcode(this.scannerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });
      await this.startScanner(cameraId);
    } catch (error: any) {
      console.error('Erreur changement caméra', error);
      this.cameraError = this.mapCameraError(error);
      this.loading = false;
    }
  }

  async retry(): Promise<void> {
    await this.stopScannerSilently();
    this.scanSuccess = false;
    this.scannedText = '';
    await this.initScanner();
  }

  async close(): Promise<void> {
    this.isClosing = true;
    await this.stopScannerSilently();
    this.dialogRef.close(null);
  }

  async toggleTorch(): Promise<void> {
    if (!this.html5QrCode || !this.isStarted || !this.torchSupported) return;

    try {
      this.torchEnabled = !this.torchEnabled;
      await this.html5QrCode.applyVideoConstraints({
        advanced: [{ torch: this.torchEnabled } as any]
      });
    } catch (error) {
      console.error('Torch non supportée', error);
      this.torchEnabled = false;
    }
  }

  private async stopScannerSilently(): Promise<void> {
    try {
      if (this.html5QrCode && this.isStarted) {
        await this.html5QrCode.stop();
      }
    } catch (error) {
      console.warn('Erreur stop scanner', error);
    }

    try {
      await this.html5QrCode?.clear();
    } catch (error) {
      console.warn('Erreur clear scanner', error);
    }

    this.isStarted = false;
  }

  private chooseBackCamera(cameras: Array<{ id: string; label: string }>) {
    return cameras.find(c =>
      /back|rear|environment|trás|tras|arrière|world/i.test(c.label || '')
    );
  }

  private mapCameraError(error: any): string {
    const raw = String(error?.message || error || '').toLowerCase();

    if (raw.includes('notallowederror') || raw.includes('permission')) {
      return 'Accès caméra refusé. Autorise la caméra dans le navigateur.';
    }

    if (raw.includes('notfounderror')) {
      return 'Aucune caméra disponible.';
    }

    if (raw.includes('notreadableerror')) {
      return 'La caméra est déjà utilisée par une autre application.';
    }

    if (raw.includes('overconstrainederror')) {
      return 'Caméra incompatible avec la configuration demandée.';
    }

    return 'Impossible de démarrer la caméra.';
  }

  private playBeep(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioCtx = this.audioCtx || new AudioCtx();

      const duration = 0.12;
      const oscillator = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 1040;

      gainNode.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      oscillator.start();
      oscillator.stop(this.audioCtx.currentTime + duration);
    } catch (error) {
      console.warn('Bip sonore indisponible', error);
    }
  }

  get selectedCameraLabel(): string {
    return this.cameras.find(c => c.id === this.selectedCameraId)?.label || 'Caméra';
  }

}
