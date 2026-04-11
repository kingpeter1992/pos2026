import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { VenteStore } from '../../service/VenteStore';

@Component({
  selector: 'app-retours-produits.component',
  templateUrl: './retours-produits.component.html',
  styleUrl: './retours-produits.component.css',
  standalone: false
})
export class RetoursProduitsComponent implements OnInit {

  displayedColumns: string[] = [
    'ticketNumero',
    'dateVente',
    'clientNom',
    'caissier',
    'modePaiement',
    'totalGeneral',
    'statut',
    'actions'
  ];

  constructor(
    public storeVente: VenteStore,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.storeVente.load();
  }

  annulerVente(vente: any): void {
    if (!vente?.id) {
      this.toastr.error('Vente introuvable.');
      return;
    }

    if (vente?.statut === 'ANNULEE') {
      this.toastr.warning('Cette vente est déjà annulée.');
      return;
    }

    const confirmation = window.confirm(
      `Voulez-vous vraiment annuler la vente ${vente.ticketNumero || ''} ?\n\nCette opération va remettre les articles en stock.`
    );

    if (!confirmation) {
      return;
    }

    this.storeVente.annulerVente(vente.id).subscribe({
      next: () => {
        this.toastr.success('Vente annulée avec succès. Le stock a été réintégré.');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(
          err?.error?.message || 'Erreur lors de l’annulation de la vente.'
        );
      }
    });
  }

  isVenteAnnulable(vente: any): boolean {
    return !!vente && vente.statut !== 'ANNULEE';
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'VALIDE':
        return 'badge valide';
      case 'ANNULEE':
        return 'badge annulee';
      default:
        return 'badge';
    }
  }
}
