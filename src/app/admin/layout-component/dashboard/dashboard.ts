import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Toast } from '../../../shares/services/toast/toast';
import {  ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { VenteStore } from '../../pos/service/VenteStore';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  standalone: false,
})
export class Dashboard implements   OnInit {

  customersChartData: any;
  customersChartOptions: any;

  divisionChartData: any;
  divisionChartOptions: any;

  avgChartData: any;
  avgChartOptions: any;

  topArticlesChartData: any;
  topArticlesChartOptions: any;

  cityChartData: any;
  cityChartOptions: any;

  stockChartData: any;
  stockChartOptions: any;

  kpis: any[] = [];

  ventes: any[] = [];

    constructor(private venteStore: VenteStore) {}


  ngOnInit(): void {
        this.loadData();
  }


   private loadData(): void {
    this.venteStore.loadIfNeeded().subscribe({
      next: (data) => {
        this.ventes = data || [];
        this.initCharts(); // 🔥 recalcul dynamique
      },
      error: () => {
        this.ventes = [];
        this.initCharts();
      }
    });
  }

  initCharts(): void {
    const textColor = '#4b5563';
    const textMuted = '#6b7280';
    const gridColor = '#e5e7eb';

    const palette = {
      primary: '#0f4c81',
      secondary: '#14b8a6',
      accent: '#3b82f6',
      dark: '#334155',
      soft: '#94a3b8',
      warn: '#f59e0b',
      danger: '#ef4444',
      success: '#10b981'
    };

    const tickets = [...this.ventes].sort(
      (a, b) =>
        new Date(a.dateVente).getTime() - new Date(b.dateVente).getTime()
    );

    const safeTotal = (vente: any): number => {
      const totalGeneral = Number(vente?.totalGeneral || 0);
      if (totalGeneral > 0) return totalGeneral;

      const lignesTotal = (vente?.lignes || []).reduce(
        (sum: number, l: any) => sum + Number(l?.totalLigne || 0),
        0
      );

      if (lignesTotal > 0) return lignesTotal;

      return Number(vente?.sousTotal || 0);
    };

    const safeUnits = (vente: any): number =>
      (vente?.lignes || []).reduce(
        (sum: number, l: any) => sum + Number(l?.quantite || 0),
        0
      );

    const labelsTickets = tickets.map((v) => `#${v.id}`);

    const totalsParTicket = tickets.map((v) => safeTotal(v));
    const unitesParTicket = tickets.map((v) => safeUnits(v));
    const lignesParTicket = tickets.map((v) => (v?.lignes || []).length);

    const totalVentes = totalsParTicket.reduce((a, b) => a + b, 0);
    const totalUnites = unitesParTicket.reduce((a, b) => a + b, 0);
    const nbTickets = tickets.length;
    const panierMoyen = nbTickets ? totalVentes / nbTickets : 0;
    const unitesMoyennes = nbTickets ? totalUnites / nbTickets : 0;

    const totalRemises = tickets.reduce(
      (sum, v) => sum + Number(v?.totalRemise || 0),
      0
    );

    const anomalies = tickets.filter((v) => {
      const totalGeneral = Number(v?.totalGeneral || 0);
      const lignesTotal = (v?.lignes || []).reduce(
        (sum: number, l: any) => sum + Number(l?.totalLigne || 0),
        0
      );
      return totalGeneral === 0 && lignesTotal > 0;
    });

    const byModePaiement = tickets.reduce((acc: any, v: any) => {
      const key = v.modePaiement || 'NON DEFINI';
      acc[key] = (acc[key] || 0) + safeTotal(v);
      return acc;
    }, {});

    const articleMap = new Map<
      string,
      { quantite: number; montant: number }
    >();

    tickets.forEach((vente) => {
      (vente.lignes || []).forEach((ligne: any) => {
        const key = ligne.produitNom || `Produit ${ligne.produitId}`;
        const existing = articleMap.get(key) || { quantite: 0, montant: 0 };
        existing.quantite += Number(ligne.quantite || 0);
        existing.montant += Number(ligne.totalLigne || 0);
        articleMap.set(key, existing);
      });
    });

    const topArticles = Array.from(articleMap.entries())
      .sort((a, b) => b[1].quantite - a[1].quantite)
      .slice(0, 7);

    const heuresMap = tickets.reduce((acc: any, v: any) => {
      const hour = new Date(v.dateVente).getHours();
      const label = `${hour.toString().padStart(2, '0')}h`;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const encaissementTotal = tickets.reduce(
      (sum, v) => sum + Number(v?.montantRecu || 0),
      0
    );

    this.kpis = [
      {
        label: 'Chiffre d’affaires total',
        value: `${this.formatMoney(totalVentes)} USD`,
        icon: 'pi pi-dollar',
        trend: `${nbTickets} tickets`
      },
      {
        label: 'Panier moyen',
        value: `${this.formatMoney(panierMoyen)} USD`,
        icon: 'pi pi-shopping-cart',
        trend: `${this.formatNumber(unitesMoyennes)} u./ticket`
      },
      {
        label: 'Quantité totale vendue',
        value: `${this.formatNumber(totalUnites)}`,
        icon: 'pi pi-box',
        trend: `${topArticles.length} article(s)`
      },
      {
        label: 'Tickets incohérents',
        value: `${anomalies.length}`,
        icon: 'pi pi-exclamation-triangle',
        trend: anomalies.length > 0 ? 'À corriger' : 'OK'
      }
    ];

    // 1) Ancien bloc "Total Clients & Visiteurs"
    // => adapté en "Transactions & lignes"
    this.customersChartData = {
      labels: labelsTickets,
      datasets: [
        {
          label: 'Quantités vendues',
          backgroundColor: palette.accent,
          borderRadius: 4,
          data: unitesParTicket
        },
        {
          label: 'Lignes par ticket',
          backgroundColor: palette.secondary,
          borderRadius: 4,
          data: lignesParTicket
        }
      ]
    };

    this.customersChartOptions = this.buildBarOptions(textColor, gridColor);

    // 2) Ancien bloc "Ventes par division"
    // => adapté en "Ventes par mode de paiement"
    this.divisionChartData = {
      labels: Object.keys(byModePaiement),
      datasets: [
        {
          label: 'Montant',
          backgroundColor: [palette.secondary, palette.accent, palette.warn],
          borderRadius: 6,
          data: Object.values(byModePaiement)
        }
      ]
    };

    this.divisionChartOptions = this.buildSimpleBarOptions(
      textColor,
      gridColor
    );

    // 3) Ancien bloc "Prix moyen & unités par transaction"
    // => adapté en "Montant & unités par ticket"
    this.avgChartData = {
      labels: labelsTickets,
      datasets: [
        {
          type: 'line',
          label: 'Montant ticket (USD)',
          borderColor: palette.accent,
          backgroundColor: palette.accent,
          tension: 0.35,
          fill: false,
          data: totalsParTicket
        },
        {
          type: 'line',
          label: 'Unités / ticket',
          borderColor: palette.secondary,
          backgroundColor: palette.secondary,
          tension: 0.35,
          fill: false,
          data: unitesParTicket
        }
      ]
    };

    this.avgChartOptions = this.buildLineOptions(textColor, gridColor);

    // 4) Top articles vendus
    this.topArticlesChartData = {
      labels: topArticles.map(([nom]) => nom),
      datasets: [
        {
          label: 'Quantités vendues',
          backgroundColor: [
            palette.secondary,
            palette.accent,
            '#8d99ae',
            '#2b2d42',
            '#52b788',
            '#219ebc',
            '#6c757d'
          ],
          borderRadius: 5,
          data: topArticles.map(([, data]) => data.quantite)
        }
      ]
    };

    this.topArticlesChartOptions = this.buildSimpleBarOptions(
      textColor,
      gridColor
    );

    // 5) Ancien bloc "Ventes par ville"
    // => adapté en "Répartition CA par ticket"
    this.cityChartData = {
      labels: tickets.map((v) => `Ticket #${v.id}`),
      datasets: [
        {
          data: totalsParTicket,
          backgroundColor: [
            '#14b8a6',
            '#99d8d0',
            '#2d9cdb',
            '#8ecae6',
            '#6c757d',
            '#ced4da',
            '#2b2d42'
          ],
          hoverOffset: 6
        }
      ]
    };

    this.cityChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: textColor,
            usePointStyle: true,
            boxWidth: 10
          }
        }
      }
    };

    // 6) Ancien bloc "Produits en rupture"
    // => adapté en "Encaissement vs ventes + anomalies"
    this.stockChartData = {
      labels: ['Encaissement', 'Ventes calculées', 'Remises', 'Anomalies'],
      datasets: [
        {
          type: 'bar',
          label: 'Valeur',
          backgroundColor: '#4db6ac',
          borderRadius: 4,
          data: [
            this.round2(encaissementTotal),
            this.round2(totalVentes),
            this.round2(totalRemises),
            anomalies.length
          ]
        },
        {
          type: 'line',
          label: 'Tickets par heure',
          borderColor: palette.accent,
          backgroundColor: palette.accent,
          tension: 0.35,
          fill: false,
          data: [
            Object.keys(heuresMap).length,
            Object.keys(heuresMap).length,
            Object.keys(heuresMap).length,
            Object.keys(heuresMap).length
          ]
        }
      ]
    };

    this.stockChartOptions = this.buildMixedOptions(
      textColor,
      gridColor,
      textMuted
    );
  }

  private formatMoney(value: number): string {
    return this.round2(value).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private formatNumber(value: number): string {
    return this.round2(value).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  private round2(value: number): number {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  private buildBarOptions(textColor: string, gridColor: string) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      }
    };
  }

  private buildSimpleBarOptions(textColor: string, gridColor: string) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      }
    };
  }

  private buildLineOptions(textColor: string, gridColor: string) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      }
    };
  }

  private buildMixedOptions(textColor: string, gridColor: string, textMuted: string) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textMuted,
            usePointStyle: true
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      }
    };
  }
}
