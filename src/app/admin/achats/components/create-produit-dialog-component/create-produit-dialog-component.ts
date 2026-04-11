import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, Subject, takeUntil } from 'rxjs';

import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { CategorieStoreService } from '../../../produits/core/categorie-store.service';
import { ProduitStoreService } from '../../../produits/core/produit-store.service';
import { CategorieResponse } from '../../../produits/models/categorie.model';
import { ProduitResponse, ImagePhotoRequest, ProduitRequest } from '../../../produits/models/produit.model';
import { ImageOptimizer } from '../../../produits/service/images-optimizer/image-optimizer';
import { ProduitService } from '../../../produits/service/produit-service/produit-service';
import { Toast } from '../../../../shares/services/toast/toast';


@Component({
  selector: 'app-create-produit-dialog',
  templateUrl: './create-produit-dialog-component.html',
  styleUrl: './create-produit-dialog-component.css',
  standalone: false
})
export class CreateProduitDialogComponent implements OnInit, OnDestroy {
  categories: CategorieResponse[] = [];
  loading = false;
  produitCree?: ProduitResponse;

  form!: FormGroup;

  previews: string[] = [];
  selectedImages: ImagePhotoRequest[] = [];

  cameraOpen = false;
  cameraLoading = false;
  cameraError = '';
  stream: MediaStream | null = null;

  readonly MAX_FILES = 5;
  readonly MAX_INPUT_FILE_SIZE_MB = 8;

  @ViewChild('cameraVideo') cameraVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('barcodeVideo') barcodeVideoRef?: ElementRef<HTMLVideoElement>;

  barcodeScannerOpen = false;
  barcodeScannerLoading = false;
  barcodeScannerError = '';

  cameraDevices: MediaDeviceInfo[] = [];
  selectedCameraId: string | null = null;

  private barcodeReader: BrowserMultiFormatReader | null = null;
  private barcodeScannerControls: IScannerControls | null = null;
  private barcodeScannerTimeout: any = null;
  private lastScannedCode = '';
  private audioCtx?: AudioContext;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private categorieStore: CategorieStoreService,
    private produitService: ProduitService,
    private produitStore: ProduitStoreService,
    private toast: Toast,
    private imageOptimizer: ImageOptimizer,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Optional() private dialogRef?: MatDialogRef<CreateProduitDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: { codeBarres?: string }
  ) {}

  get isDialogMode(): boolean {
    return !!this.dialogRef;
  }

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.prefillFromParent();
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.closeScanner();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      codeBarres: [''],
      nom: ['', [Validators.required, Validators.maxLength(150)]],
      description: [''],
      categorieId: [null],
      prixAchat: [0, [Validators.min(0)]],
      prixVente: [0, [Validators.required, Validators.min(0)]],
      stockMinimum: [0, [Validators.required, Validators.min(0)]],
      stockMaximum: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private loadCategories(): void {
    this.categorieStore.categories$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: CategorieResponse[]) => {
        this.categories = data ?? [];
      });

    this.categorieStore.loadIfNeeded().subscribe();
  }

  private prefillFromParent(): void {
    if (this.data?.codeBarres) {
      this.form.patchValue({
        codeBarres: this.data.codeBarres
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const payload: ProduitRequest = {
      ...formValue,
      codeBarres: formValue.codeBarres?.trim() || null,
      images: this.selectedImages
    } as ProduitRequest;

    this.loading = true;

    this.produitService.create(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: ProduitResponse) => {
          this.produitCree = res;
          this.produitStore.addOne(res);
          this.toast.success('Produit ajouté avec succès');

          if (this.isDialogMode) {
            this.dialogRef?.close(res);
            return;
          }

          this.resetFormAfterSave();
        },
        error: (err: { error: { message: any } }) => {
          console.error(err);
          this.toast.error(err?.error?.message || 'Erreur lors de la création du produit.');
        }
      });
  }

  cancel(): void {
    this.stopCamera();
    this.closeScanner();

    if (this.isDialogMode) {
      this.dialogRef?.close();
      return;
    }

    this.router.navigate(['/admin/produits']);
  }

  resetFormAfterSave(): void {
    this.form.reset({
      codeBarres: '',
      nom: '',
      description: '',
      categorieId: null,
      prixAchat: 0,
      prixVente: 0,
      stockMinimum: 0,
      stockMaximum: 0
    });

    this.previews = [];
    this.selectedImages = [];
    this.produitCree = undefined;
  }

  getBarcodeUrl(id: number): string {
    return this.produitService.getBarcodeImageUrl(id);
  }

  private handleScannedBarcode(codeBarres: string): void {
    this.produitService.findByCodeBarres(codeBarres).subscribe({
      next: (produit: ProduitResponse) => {
        if (produit?.id) {
          if (this.isDialogMode) {
            this.toast.info('Ce code-barres existe déjà. Produit récupéré.');
            this.dialogRef?.close(produit);
            return;
          }

          this.toast.info('Ce code-barres existe déjà. Redirection vers le détail du produit...');
          this.openProduit(produit);
          return;
        }

        this.toast.success('Code-barres disponible. Vous pouvez continuer la création.');
      },
      error: (err: { status: number }) => {
        if (err?.status === 404) {
          this.toast.success('Code-barres non existant. Vous pouvez créer le produit.');
          return;
        }

        console.error(err);
        this.toast.error('Erreur lors de la vérification du code-barres.');
      }
    });
  }

  openProduit(produit: ProduitResponse): void {
    this.router.navigate([`/admin/produits/images/${produit.id}`]);
  }

  async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    const remaining = this.MAX_FILES - this.selectedImages.length;
    const fileList = Array.from(files).slice(0, remaining);

    for (const file of fileList) {
      if (file.size > this.MAX_INPUT_FILE_SIZE_MB * 1024 * 1024) {
        console.warn(`Image ignorée car trop lourde: ${file.name}`);
        continue;
      }

      try {
        const optimized = await this.imageOptimizer.optimizeFile(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.72,
          outputType: 'image/jpeg'
        });

        this.previews.push(optimized.base64);
        this.selectedImages.push({
          nomFichier: optimized.fileName,
          contentType: optimized.contentType,
          url: optimized.base64,
          principale: this.selectedImages.length === 0 && this.previews.length === 1
        });
      } catch (error) {
        console.error('Erreur compression image galerie', error);
      }
    }

    input.value = '';
    this.ensureMainImage();
  }

  async startCamera(): Promise<void> {
    this.cameraError = '';
    this.cameraLoading = true;

    if (this.barcodeScannerOpen) {
      this.closeScanner();
    }

    this.cameraOpen = true;
    this.cdr.detectChanges();

    try {
      await this.waitForCameraVideoElement();

      const video = this.cameraVideoRef?.nativeElement;
      if (!video) {
        throw new Error('Élément vidéo webcam introuvable.');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      video.srcObject = this.stream;
      video.muted = true;
      video.setAttribute('autoplay', 'true');
      video.setAttribute('playsinline', 'true');

      await video.play();
    } catch (error: any) {
      console.error('Erreur webcam photo:', error);
      this.cameraError =
        this.mapCameraError(error) || 'Impossible d’ouvrir la webcam.';
      this.cameraOpen = false;
    } finally {
      this.cameraLoading = false;
      this.cdr.detectChanges();
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    const video = this.cameraVideoRef?.nativeElement;
    if (video) {
      try {
        video.pause();
      } catch {}
      video.srcObject = null;
    }

    this.cameraOpen = false;
    this.cameraLoading = false;
    this.cameraError = '';
  }

  async captureFromCamera(video: HTMLVideoElement): Promise<void> {
    if (!video.videoWidth || !video.videoHeight) return;
    if (this.selectedImages.length >= this.MAX_FILES) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    try {
      const optimized = await this.imageOptimizer.optimizeDataUrl(rawDataUrl, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.72,
        outputType: 'image/jpeg',
        fileName: `camera_${Date.now()}.jpg`
      });

      this.previews.push(optimized.base64);
      this.selectedImages.push({
        nomFichier: optimized.fileName,
        contentType: optimized.contentType,
        url: optimized.base64,
        principale: this.selectedImages.length === 0
      });

      this.ensureMainImage();
    } catch (error) {
      console.error('Erreur compression photo webcam', error);
    }
  }

  setAsMain(index: number): void {
    this.selectedImages = this.selectedImages.map((img, i) => ({
      ...img,
      principale: i === index
    }));
  }

  removeImage(index: number): void {
    const removedWasMain = this.selectedImages[index]?.principale;

    this.selectedImages.splice(index, 1);
    this.previews.splice(index, 1);

    if (removedWasMain) {
      this.ensureMainImage();
    }
  }

  private ensureMainImage(): void {
    if (this.selectedImages.length === 0) return;

    const hasMain = this.selectedImages.some(img => img.principale);
    if (!hasMain) {
      this.selectedImages[0].principale = true;
    }
  }

  async openScanner(): Promise<void> {
    this.barcodeScannerError = '';
    this.barcodeScannerLoading = true;

    if (this.cameraOpen) {
      this.stopCamera();
    }

    this.closeScanner();
    this.barcodeScannerOpen = true;
    this.cdr.detectChanges();

    try {
      await this.waitForBarcodeVideoElement();

      const video = this.barcodeVideoRef?.nativeElement;
      if (video) {
        video.muted = true;
        video.setAttribute('autoplay', 'true');
        video.setAttribute('playsinline', 'true');
      }

      await this.reloadCameraDevices();

      if (!this.cameraDevices.length) {
        this.barcodeScannerError = 'Aucune caméra détectée.';
        return;
      }

      if (!this.selectedCameraId) {
        this.selectedCameraId =
          this.pickBestCamera(this.cameraDevices)?.deviceId ?? this.cameraDevices[0].deviceId;
      }

      await this.startScannerWithDevice(this.selectedCameraId);
    } catch (error: any) {
      console.error('Erreur ouverture scanner:', error);
      this.barcodeScannerError =
        this.mapCameraError(error) || 'Impossible d’ouvrir le scanner.';
    } finally {
      this.barcodeScannerLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeScanner(): void {
    this.clearBarcodeTimeout();

    try {
      this.barcodeScannerControls?.stop();
    } catch (e) {
      console.warn('Erreur stop scanner:', e);
    }

    this.barcodeScannerControls = null;
    this.barcodeReader = null;

    const video = this.barcodeVideoRef?.nativeElement;
    if (video) {
      try {
        video.pause();
      } catch {}

      const stream = video.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      video.srcObject = null;
    }

    this.barcodeScannerOpen = false;
    this.barcodeScannerLoading = false;
    this.lastScannedCode = '';
  }

  async reloadCameraDevices(): Promise<void> {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      tempStream.getTracks().forEach(track => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      this.cameraDevices = devices.filter(d => d.kind === 'videoinput');

      if (!this.selectedCameraId && this.cameraDevices.length) {
        this.selectedCameraId =
          this.pickBestCamera(this.cameraDevices)?.deviceId ?? this.cameraDevices[0].deviceId;
      }
    } catch (error: any) {
      console.error('Erreur enumerateDevices:', error);
      this.barcodeScannerError =
        this.mapCameraError(error) || 'Impossible de charger les caméras.';
    }
  }

  async onCameraChange(deviceId: string): Promise<void> {
    this.selectedCameraId = deviceId;

    if (!this.barcodeScannerOpen) return;

    try {
      await this.startScannerWithDevice(deviceId);
    } catch (error: any) {
      console.error('Erreur changement caméra:', error);
      this.barcodeScannerError =
        this.mapCameraError(error) || 'Impossible de changer de caméra.';
    }
  }

  private async startScannerWithDevice(deviceId: string): Promise<void> {
    this.barcodeScannerError = '';
    this.barcodeScannerLoading = true;
    this.clearBarcodeTimeout();

    try {
      if (!this.barcodeVideoRef?.nativeElement) {
        throw new Error('Élément vidéo scanner introuvable.');
      }

      try {
        this.barcodeScannerControls?.stop();
      } catch {}

      const video = this.barcodeVideoRef.nativeElement;

      const oldStream = video.srcObject as MediaStream | null;
      if (oldStream) {
        oldStream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }

      this.barcodeReader = new BrowserMultiFormatReader();

      this.barcodeScannerControls = await this.barcodeReader.decodeFromVideoDevice(
        deviceId,
        video,
        async (result, error, _controls) => {
          if (result) {
            const scannedCode = result.getText()?.trim();
            if (!scannedCode) return;

            if (scannedCode === this.lastScannedCode) return;
            this.lastScannedCode = scannedCode;

            this.playBeep();

            this.form.patchValue({ codeBarres: scannedCode });
            this.form.get('codeBarres')?.markAsDirty();
            this.form.get('codeBarres')?.markAsTouched();

            this.toast.success(`Code-barres détecté : ${scannedCode}`);
            this.handleScannedBarcode(scannedCode);

            setTimeout(() => {
              this.lastScannedCode = '';
            }, 1200);
          }

          if (error) {
            // bruit normal de scan
          }
        }
      );

      const stream = video.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()[0];

      try {
        const capabilities: any = track?.getCapabilities?.();
        if (track && capabilities) {
          const advanced: any = {};

          if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            advanced.focusMode = 'continuous';
          }

          if (capabilities.zoom) {
            advanced.zoom = Math.min(2, capabilities.zoom.max ?? 2);
          }

          if (Object.keys(advanced).length) {
            await track.applyConstraints({ advanced: [advanced] as any });
          }
        }
      } catch (focusError) {
        console.warn('Autofocus non disponible:', focusError);
      }

      this.barcodeScannerTimeout = setTimeout(() => {
        this.barcodeScannerError = 'Aucun code-barres détecté.';
        this.toast.warning('Aucun code-barres détecté');
      }, 15000);
    } catch (error: any) {
      console.error('Erreur startScannerWithDevice:', error);
      this.barcodeScannerError =
        this.mapCameraError(error) || 'Impossible d’ouvrir la caméra.';
      throw error;
    } finally {
      this.barcodeScannerLoading = false;
      this.cdr.detectChanges();
    }
  }

  private pickBestCamera(devices: MediaDeviceInfo[]): MediaDeviceInfo | null {
    if (!devices.length) return null;

    const preferred = devices.find(d => {
      const label = (d.label || '').toLowerCase();
      return (
        label.includes('rear') ||
        label.includes('back') ||
        label.includes('usb') ||
        label.includes('integrated') ||
        label.includes('hd webcam')
      );
    });

    return preferred ?? devices[0];
  }

  private mapCameraError(error: any): string {
    const name = error?.name || '';
    const message = error?.message || '';

    if (name === 'NotAllowedError') {
      return 'Accès caméra refusé. Autorisez la caméra dans le navigateur et dans Windows.';
    }

    if (name === 'NotReadableError') {
      return 'La caméra est déjà utilisée par une autre application ou bloquée par le système.';
    }

    if (name === 'OverconstrainedError') {
      return 'La configuration de la caméra n’est pas compatible.';
    }

    if (name === 'AbortError') {
      return 'Ouverture de la caméra interrompue.';
    }

    return message;
  }

  private clearBarcodeTimeout(): void {
    if (this.barcodeScannerTimeout) {
      clearTimeout(this.barcodeScannerTimeout);
      this.barcodeScannerTimeout = null;
    }
  }

  private async waitForCameraVideoElement(maxRetries = 20, delay = 100): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      if (this.cameraVideoRef?.nativeElement) return;
      await new Promise(resolve => setTimeout(resolve, delay));
      this.cdr.detectChanges();
    }

    throw new Error('Élément vidéo webcam non disponible dans le DOM.');
  }

  private async waitForBarcodeVideoElement(maxRetries = 20, delay = 100): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      if (this.barcodeVideoRef?.nativeElement) return;
      await new Promise(resolve => setTimeout(resolve, delay));
      this.cdr.detectChanges();
    }

    throw new Error('Élément vidéo scanner non disponible dans le DOM.');
  }

  private playBeep(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }

      const ctx = this.audioCtx;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1046, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Bip non disponible:', e);
    }
  }
}
