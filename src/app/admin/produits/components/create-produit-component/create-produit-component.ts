import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { CategorieStoreService } from '../../core/categorie-store.service';
import { ProduitStoreService } from '../../core/produit-store.service';
import { CategorieResponse } from '../../models/categorie.model';
import { ProduitResponse, ImagePhotoRequest, ProduitRequest } from '../../models/produit.model';
import { ProduitService } from '../../service/produit-service/produit-service';
import { Toast } from '../../../../shares/services/toast/toast';
import { ImageOptimizer } from '../../service/images-optimizer/image-optimizer';
import { Router } from '@angular/router';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeCameraScanConfig
} from 'html5-qrcode';
import { CaisseStoreService } from '../../../caisse/services/CaisseServiceStore';

@Component({
  selector: 'app-create-produit-component',
  templateUrl: './create-produit-component.html',
  styleUrl: './create-produit-component.css',
  standalone: false,
})
export class CreateProduitComponent implements OnInit, OnDestroy {
  categories: CategorieResponse[] = [];
  loading = false;
  produitCree?: ProduitResponse;
  form!: FormGroup;
  private audioCtx?: AudioContext;
  private hasPlayedBeep = false;
  previews: string[] = [];
  selectedImages: ImagePhotoRequest[] = [];
dernierTaux = 0;
prixUsd = 0;
loadingTaux = false;
  cameraOpen = false;
  cameraLoading = false;
  cameraError = '';
  stream: MediaStream | null = null;

  readonly MAX_FILES = 5;
  readonly MAX_INPUT_FILE_SIZE_MB = 8;

  barcodeScannerOpen = false;
  barcodeScannerLoading = false;
  barcodeScannerError = '';

  availableBarcodeCameras: Array<{ id: string; label: string }> = [];
  selectedBarcodeCameraId: string | null = null;

  private html5QrCode: Html5Qrcode | null = null;
  private readonly barcodeScannerContainerId = 'barcode-scanner-region';
  private barcodeScannerTimeout: any = null;
  private barcodeScanLocked = false;

  constructor(
    private fb: FormBuilder,
    private categorieStore: CategorieStoreService,
    private produitService: ProduitService,
    private produitStore: ProduitStoreService,
    private toast: Toast,
    private imageOptimizer: ImageOptimizer,
    private router: Router,
      private caisseStore: CaisseStoreService

  ) { }

ngOnInit(): void {
  this.categorieStore.categories$.subscribe(data => {
    this.categories = data;
  });

  this.categorieStore.loadIfNeeded().subscribe();

  this.form = this.fb.group({
    codeBarres: [''],
    nom: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    categorieId: [null],
    perissable: ['NON'],

    // Ici le prix est saisi en Franc Congolais
    prixVente: [0, [Validators.required, Validators.min(0)]],

    stockMinimum: [0, [Validators.required, Validators.min(0)]],
    stockMaximum: [0, [Validators.required, Validators.min(0)]]
  });

  this.chargerDernierTauxActif();

  this.form.get('prixVente')?.valueChanges.subscribe(() => {
    this.calculPrixUsd();
  });
}


private chargerDernierTauxActif(): void {
  this.loadingTaux = true;
  this.caisseStore.loadTauxActif().subscribe({
    next: (taux) => {
      this.dernierTaux = Number(taux?.taux ?? 0);
      this.calculPrixUsd();
      this.loadingTaux = false;
    },
    error: (err) => {
      console.error(err);
      this.loadingTaux = false;
      this.dernierTaux = 0;
      this.prixUsd = 0;
      this.toast.warning('Aucun taux de change actif trouvé.');
    }
  });
}

private calculPrixUsd(): void {
  const prixFc = Number(this.form.get('prixVente')?.value ?? 0);

  if (!prixFc || !this.dernierTaux || this.dernierTaux <= 0) {
    this.prixUsd = 0;
    return;
  }

  this.prixUsd = +(prixFc / this.dernierTaux).toFixed(2);
}

formatFc(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

formatUsd(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

  ngOnDestroy(): void {
    this.stopCamera();
    this.stopBarcodeScanner(false);
  }

  get f() {
    return this.form.controls;
  }

  onPerissableToggle(checked: boolean): void {
    this.form.get('perissable')?.setValue(checked ? 'OUI' : 'NON');
  }

  resetForm(): void {
    this.form.reset({
      codeBarres: '',
      nom: '',
      description: '',
      categorieId: null,
      prixVente: 0,
      stockMinimum: 0,
      stockMaximum: 0,
      perissable: 'NON'
    });

    this.previews = [];
    this.selectedImages = [];
    this.produitCree = undefined;
    this.cameraError = '';
    this.barcodeScannerError = '';

    this.stopCamera();
    this.stopBarcodeScanner(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

  const payload: ProduitRequest = {
    ...formValue,

    prixVenteFc: formValue.prixVente,
    prixVenteUsd: this.prixUsd,
    tauxChangeUtilise: this.dernierTaux,

    codeBarres: formValue.codeBarres?.trim() || null,
    images: this.selectedImages
  };

    this.loading = true;

    this.produitService.create(payload).subscribe({
      next: (res) => {
        this.produitCree = res;
        this.produitStore.addOne(res);
        this.toast.success('Produit ajouté avec succès');
        this.loading = false;

        this.form.reset({
          codeBarres: '',
          nom: '',
          description: '',
          categorieId: null,
          prixVente: 0,
          stockMinimum: 0,
          stockMaximum: 0,
          perissable: 'NON'
        });

        this.previews = [];
        this.selectedImages = [];
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.toast.error(
          err?.error?.message || 'Erreur lors de la création du produit.'
        );
      }
    });
  }

  getBarcodeUrl(id: number): string {
    return this.produitService.getBarcodeImageUrl(id);
  }

  async startBarcodeScanner(): Promise<void> {
  this.barcodeScannerError = '';
  this.barcodeScannerLoading = true;
  this.barcodeScanLocked = false;
  this.hasPlayedBeep = false;

  await this.stopBarcodeScanner(false);
  this.barcodeScannerOpen = true;

  setTimeout(async () => {
    try {
      const element = document.getElementById(this.barcodeScannerContainerId);

      if (!element) {
        this.barcodeScannerError = 'Zone scanner introuvable.';
        this.barcodeScannerLoading = false;
        this.barcodeScannerOpen = false;
        return;
      }

      this.html5QrCode = new Html5Qrcode(this.barcodeScannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });

      const cameras = await Html5Qrcode.getCameras();
      this.availableBarcodeCameras = cameras ?? [];

      if (!this.availableBarcodeCameras.length) {
        this.barcodeScannerError = 'Aucune caméra détectée.';
        this.barcodeScannerLoading = false;
        this.barcodeScannerOpen = false;
        return;
      }

      const preferredCamera =
        this.availableBarcodeCameras.find(
          c =>
            /usb|video|camera|webcam|périphérique vidéo/i.test(c.label) &&
            !/obs/i.test(c.label)
        ) ||
        this.availableBarcodeCameras.find(c => !/obs/i.test(c.label)) ||
        this.availableBarcodeCameras[0];

      this.selectedBarcodeCameraId =
        this.selectedBarcodeCameraId || preferredCamera.id;

      console.log('Caméras détectées :', this.availableBarcodeCameras);
      console.log(
        'Caméra choisie :',
        this.availableBarcodeCameras.find(
          c => c.id === this.selectedBarcodeCameraId
        )
      );

      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        aspectRatio: 1.7778,
        disableFlip: false,
        qrbox: { width: 300, height: 120 }
      };

      await this.html5QrCode.start(
        { deviceId: { exact: this.selectedBarcodeCameraId } },
        config,
        async (decodedText: string) => {
          if (this.barcodeScanLocked) return;

          const scannedCode = (decodedText || '').trim();
          if (!scannedCode) return;

          this.barcodeScanLocked = true;

          this.form.patchValue({
            codeBarres: scannedCode
          });

          this.form.get('codeBarres')?.markAsDirty();
          this.form.get('codeBarres')?.markAsTouched();

          if (!this.hasPlayedBeep) {
            this.hasPlayedBeep = true;
            this.playBeep();
          }

          this.toast.success(`Code détecté : ${scannedCode}`);

          await this.stopBarcodeScanner(false);
          this.handleScannedBarcode(scannedCode);
        },
        () => {}
      );

      this.barcodeScannerTimeout = setTimeout(async () => {
        await this.stopBarcodeScanner(false);
        this.barcodeScannerError = 'Aucun code détecté.';
        this.toast.warning('Aucun code détecté');
      }, 15000);
    } catch (error: any) {
      console.error('Erreur scanner:', error);

      if (error?.name === 'NotAllowedError') {
        this.barcodeScannerError = 'Permission caméra refusée.';
      } else if (error?.name === 'NotFoundError') {
        this.barcodeScannerError = 'Aucune caméra disponible.';
      } else if (error?.name === 'NotReadableError') {
        this.barcodeScannerError =
          'Caméra déjà utilisée par une autre application.';
      } else if (error?.name === 'OverconstrainedError') {
        this.barcodeScannerError =
          'Caméra demandée non disponible sur cet appareil.';
      } else {
        this.barcodeScannerError =
          error?.message || 'Impossible de démarrer la caméra.';
      }

      this.barcodeScannerOpen = false;
    } finally {
      this.barcodeScannerLoading = false;
    }
  }, 250);
}
  async onBarcodeCameraChange(): Promise<void> {
    if (!this.selectedBarcodeCameraId) return;
    await this.stopBarcodeScanner(false);
    await this.startBarcodeScanner();
  }

  async stopBarcodeScanner(resetError = false): Promise<void> {
    this.clearBarcodeTimeout();
    this.barcodeScanLocked = false;

    try {
      if (this.html5QrCode) {
        try {
          await this.html5QrCode.stop();
        } catch (_) { }

        try {
          await this.html5QrCode.clear();
        } catch (_) { }
      }
    } finally {
      this.html5QrCode = null;
      this.barcodeScannerOpen = false;

      if (resetError) {
        this.barcodeScannerError = '';
      }
    }
  }

  private clearBarcodeTimeout(): void {
    if (this.barcodeScannerTimeout) {
      clearTimeout(this.barcodeScannerTimeout);
      this.barcodeScannerTimeout = null;
    }
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

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        },
        audio: false
      });

      this.cameraOpen = true;

      setTimeout(() => {
        const video = document.querySelector(
          'video[data-camera-preview="true"]'
        ) as HTMLVideoElement | null;

        if (video) {
          video.srcObject = this.stream;
          video.play().catch(console.error);
        }
      }, 200);
    } catch (error) {
      console.error(error);
      this.cameraError = 'Impossible d’accéder à la webcam.';
    } finally {
      this.cameraLoading = false;
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.cameraOpen = false;
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

  private async handleScannedBarcode(codeBarres: string): Promise<void> {
    this.produitService.findByCodeBarres(codeBarres).subscribe({
      next: (produit) => {
        if (produit && produit.id) {
          this.toast.info(
            'Ce code-barres existe déjà. Redirection vers le détail du produit...'
          );
          this.openProduit(produit);
        } else {
          this.toast.success(
            'Code-barres non existant. Vous pouvez créer le produit.'
          );
        }
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erreur serveur.');
      }
    });
  }

  openProduit(produit: ProduitResponse): void {
    this.router.navigate([`/admin/produits/images/${produit.id}`]);
  }


  private playBeep(): void {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      const ctx = this.audioCtx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.warn('Impossible de jouer le bip sonore :', error);
    }
  }
}
