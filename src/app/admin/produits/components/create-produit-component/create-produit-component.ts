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
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
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
  previews: string[] = [];
  selectedImages: ImagePhotoRequest[] = [];
  cameraOpen = false;
  cameraLoading = false;
  cameraError = '';
  stream: MediaStream | null = null;
  readonly MAX_FILES = 5;
  readonly MAX_INPUT_FILE_SIZE_MB = 8;

  barcodeScannerOpen = false;
  barcodeScannerLoading = false;
  barcodeScannerError = '';

  private barcodeReader: BrowserMultiFormatReader | null = null;
  private barcodeScannerControls: IScannerControls | null = null;
  private barcodeScannerTimeout: any = null;

@ViewChild('barcodeVideoRef')
barcodeVideoRef!: ElementRef<HTMLVideoElement>;

async startBarcodeScanner(): Promise<void> {
  this.barcodeScannerError = '';
  this.barcodeScannerLoading = true;

  this.stopBarcodeScanner();
  this.barcodeScannerOpen = true;

  try {
    this.barcodeReader = new BrowserMultiFormatReader();

    setTimeout(async () => {
      try {
        const video = this.barcodeVideoRef?.nativeElement;

        if (!video) {
          this.barcodeScannerError = 'Lecteur vidéo introuvable.';
          this.barcodeScannerLoading = false;
          return;
        }

        this.barcodeScannerControls = await this.barcodeReader!.decodeFromVideoDevice(
          undefined,
          video,
          async (result, error, controls) => {
            if (result) {
              const scannedCode = result.getText()?.trim();

              if (!scannedCode) {
                return;
              }

              controls.stop();
              this.barcodeScannerControls = null;
              this.barcodeScannerOpen = false;
              this.clearBarcodeTimeout();

              this.form.patchValue({
                codeBarres: scannedCode
              });

              this.form.get('codeBarres')?.markAsDirty();
              this.form.get('codeBarres')?.markAsTouched();

              this.toast.success(`Code-barres détecté : ${scannedCode}`);

              this.handleScannedBarcode(scannedCode);
            }
          }
        );

        this.barcodeScannerTimeout = setTimeout(() => {
          this.stopBarcodeScanner();
          this.barcodeScannerError = 'Aucun code-barres détecté.';
          this.toast.warning('Aucun code-barres détecté');
        }, 12000);

      } catch (error) {
        console.error(error);
        this.barcodeScannerError = 'Impossible d’ouvrir la caméra pour scanner le code-barres.';
      } finally {
        this.barcodeScannerLoading = false;
      }
    }, 200);

  } catch (error) {
    console.error(error);
    this.barcodeScannerError = 'Impossible d’initialiser le scanner.';
    this.barcodeScannerLoading = false;
    this.barcodeScannerOpen = false;
  }
}


  constructor(
    private fb: FormBuilder,
    private categorieStore: CategorieStoreService,
    private produitService: ProduitService,
    private produitStore: ProduitStoreService,
    private toast: Toast,
    private imageOptimizer: ImageOptimizer,
    private router: Router

  ) { }
  ngOnDestroy(): void {
    this.stopCamera()
    this.stopBarcodeScanner();

  }

  ngOnInit(): void {
    this.categorieStore.categories$.subscribe(data => {
      this.categories = data;
    });

    this.categorieStore.loadIfNeeded().subscribe();

    this.form = this.fb.group({
      codeBarres: [''],
      nom: ['', Validators.required],
      description: [''],
      categorieId: [null],
      prixVente: [0, [Validators.required, Validators.min(0)]],
      stockMinimum: [0, [Validators.required, Validators.min(0)]],
      stockMaximum: [0, [Validators.required, Validators.min(0)]]
    });
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
        stockMaximum: 0
      });

      this.previews = [];
      this.selectedImages = [];
    },
    error: (err) => {
      this.loading = false;
      console.error(err);
    }
  });
}

getBarcodeUrl(id: number): string {
    return this.produitService.getBarcodeImageUrl(id);
  }

  get f() {
    return this.form.controls;
  }



  async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    const remaining = this.MAX_FILES - this.selectedImages.length;
    const fileList = Array.from(files).slice(0, remaining);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

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

      // ⏳ attendre que le DOM affiche le <video>
      setTimeout(() => {
        const video = document.querySelector('video') as HTMLVideoElement;

        if (video) {
          video.srcObject = this.stream;
          video.play();
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
        this.toast.info('Ce code-barres existe déjà. Redirection vers le détail du produit...');
//        this.router.navigate(['/admin/produits/images', produit.id]);
        console.log('produit trouvé',produit);
        this.openProduit(produit);

} else {
        this.toast.success('Code-barres disponible. Vous pouvez continuer la création.');
      }
    },
    error: (err) => {
      // 404 = code introuvable => on continue la création
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
stopBarcodeScanner(): void {
  this.clearBarcodeTimeout();

  if (this.barcodeScannerControls) {
    this.barcodeScannerControls.stop();
    this.barcodeScannerControls = null;
  }

  this.barcodeReader = null;
  this.barcodeScannerOpen = false;
}

private clearBarcodeTimeout(): void {
  if (this.barcodeScannerTimeout) {
    clearTimeout(this.barcodeScannerTimeout);
    this.barcodeScannerTimeout = null;
  }
}
}
