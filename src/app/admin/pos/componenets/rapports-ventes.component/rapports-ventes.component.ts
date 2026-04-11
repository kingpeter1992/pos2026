import { Component, computed, signal } from '@angular/core';
interface PosLine {
  id: number;
  produitId: number;
  designation: string;
  codeBarres: string;
  imageUrl?: string;
  prixUnitaire: number;
  quantite: number;
  remise: number;
  stock: number;
}
@Component({
  selector: 'app-rapports-ventes.component',
  templateUrl: './rapports-ventes.component.html',
  styleUrl: './rapports-ventes.component.css',
  standalone: false
})
export class RapportsVentesComponent {
setRemiseGlobale(arg0: any) {
throw new Error('Method not implemented.');
}
supprimerLigne(_t50: PosLine) {
throw new Error('Method not implemented.');
}
updateRemise(_t50: PosLine,arg1: any) {
throw new Error('Method not implemented.');
}
incrementerQuantite(_t50: PosLine) {
throw new Error('Method not implemented.');
}
updateQuantite(_t50: PosLine,arg1: any) {
throw new Error('Method not implemented.');
}
decrementerQuantite(_t50: PosLine) {
throw new Error('Method not implemented.');
}
viderPanier() {
throw new Error('Method not implemented.');
}
ouvrirProduitDialog: any;
activerScanner() {
throw new Error('Method not implemented.');
}
setRecherche(arg0: any) {
throw new Error('Method not implemented.');
}
setModePaiement(arg0: any) {
throw new Error('Method not implemented.');
}
setClientNom(arg0: any) {
throw new Error('Method not implemented.');
}
setMontantRecu(arg0: any) {
throw new Error('Method not implemented.');
}
enregistrerVente() {
throw new Error('Method not implemented.');
}
  readonly recherche = signal('');
  readonly clientNom = signal('CLIENT DIVERS');
  readonly modePaiement = signal<'CASH' | 'CARTE' | 'MOBILE_MONEY' | 'VIREMENT'>('CASH');
  readonly montantRecu = signal(0);
  readonly remiseGlobale = signal(0);
  readonly scannerActif = signal(false);

  readonly produits = signal<PosLine[]>([
    {
      id: 1,
      produitId: 1,
      designation: 'COCA CANETTE 33CL',
      codeBarres: '1234567890123',
      prixUnitaire: 25,
      quantite: 2,
      remise: 0,
      stock: 18,
      imageUrl: 'https://placehold.co/80x80'
    },
    {
      id: 2,
      produitId: 2,
      designation: 'EAU MINERALE 1.5L',
      codeBarres: '3216549871234',
      prixUnitaire: 15,
      quantite: 1,
      remise: 0,
      stock: 34,
      imageUrl: 'https://placehold.co/80x80'
    }
  ]);

  readonly totalArticles = computed(() =>
    this.produits().reduce((sum, l) => sum + Number(l.quantite || 0), 0)
  );

  readonly sousTotal = computed(() =>
    this.produits().reduce(
      (sum, l) => sum + (Number(l.prixUnitaire || 0) * Number(l.quantite || 0)),
      0
    )
  );

  readonly totalRemise = computed(() =>
    this.produits().reduce((sum, l) => sum + Number(l.remise || 0), 0) + Number(this.remiseGlobale() || 0)
  );

  readonly totalGeneral = computed(() =>
    Math.max(0, this.sousTotal() - this.totalRemise())
  );

  readonly monnaie = computed(() =>
    Math.max(0, Number(this.montantRecu() || 0) - this.totalGeneral())
  );
}
