import {  Component, OnInit, signal } from '@angular/core'
import { VenteStore } from '../../pos/service/VenteStore';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProduitService } from '../../produits/service/produit-service/produit-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  standalone: false,
})
export class Dashboard implements   OnInit {

  dateFrom = '';
  dateTo = '';

  rapport: any;
  details: any[] = [];
  stocks: any[] = [];

  kpis: any[] = [];

  customersChartData: any;
  customersChartOptions: any;

  divisionChartData: any;
  divisionChartOptions: any;

  avgChartData: any;
  avgChartOptions: any;

  topArticlesChartData: any;
  topArticlesChartOptions: any;

  stockChartData: any;
  stockChartOptions: any;

  constructor(


  private venteStore: VenteStore,
  private produitService: ProduitService,
    private dashboardService: VenteStore) {}

  ngOnInit(): void {
    this.initCurrentMonth();
    this.loadDashboard();
  }

  initCurrentMonth(): void {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.dateFrom = this.toDateInput(first);
    this.dateTo = this.toDateInput(last);
  }

  loadDashboard(): void {
    forkJoin({
      rapport: this.venteStore.getRapportVentes(this.dateFrom, this.dateTo),
      stocks: this.produitService.getProduitsPos()
    }).subscribe({
      next: ({ rapport, stocks }) => {
        this.rapport = rapport;
        this.details = rapport?.details || [];
        this.stocks = stocks || [];
        this.buildKpis();
        this.buildCustomersChart();
        this.buildDivisionChart();
        this.buildAverageChart();
        this.buildTopArticlesChart();
        this.buildStockChart();
      },
      error: err => console.error('Erreur dashboard', err)
    });
  }

  buildKpis(): void {
    const totalCAFC = this.sum(this.details, 'totalNetCDF');
    const totalMargeFC = this.sum(this.details, 'margeCDF');
    const totalPmpFC = this.sum(this.details, 'totalPmpCDF');

    const tickets = new Set(this.details.map(x => x.numeroCC)).size;

    const totalArticles = this.details.reduce(
      (acc, x) => acc + this.num(x.quantiteFacturee),
      0
    );

    const taux = this.getTauxActif();

    this.kpis = [
      {
        label: 'Chiffre d’affaires',
        valueFc: this.formatFc(totalCAFC),
        valueUsd: this.formatUsd(this.toUsd(totalCAFC, taux)),
        monetary: true,
        icon: 'pi pi-wallet',
        trend: 'FC',
        severity: 'success',
        progress: 90
      },
      {
        label: 'Marge brute',
        valueFc: this.formatFc(totalMargeFC),
        valueUsd: this.formatUsd(this.toUsd(totalMargeFC, taux)),
        monetary: true,
        icon: 'pi pi-chart-line',
        trend: 'FC',
        severity: 'success',
        progress: 75
      },
      {
        label: 'Valeur PMP',
        valueFc: this.formatFc(totalPmpFC),
        valueUsd: this.formatUsd(this.toUsd(totalPmpFC, taux)),
        monetary: true,
        icon: 'pi pi-dollar',
        trend: 'FC',
        severity: 'info',
        progress: 65
      },
      {
        label: 'Tickets / ventes',
        value: tickets,
        monetary: false,
        icon: 'pi pi-shopping-cart',
        trend: '+',
        severity: 'warning',
        progress: 60
      },
      {
        label: 'Articles vendus',
        value: totalArticles,
        monetary: false,
        icon: 'pi pi-box',
        trend: 'Qté',
        severity: 'info',
        progress: 70
      }
    ];
  }

  buildCustomersChart(): void {
    const grouped = this.groupByDateTicket();

    this.customersChartData = {
      labels: Object.keys(grouped),
      datasets: [
        {
          label: 'Clients / tickets',
          data: Object.values(grouped),
          backgroundColor: '#2563eb',
          borderRadius: 10
        }
      ]
    };

    this.customersChartOptions = this.defaultChartOptions();
  }

  buildDivisionChart(): void {
    const grouped: Record<string, number> = {};

    this.details.forEach(x => {
      const key = x.cst || 'N/A';
      grouped[key] = (grouped[key] || 0) + this.num(x.totalNetCDF);
    });

    this.divisionChartData = {
      labels: Object.keys(grouped),
      datasets: [
        {
          label: 'Montant FC',
          data: Object.values(grouped),
          backgroundColor: '#14b8a6',
          borderRadius: 10
        }
      ]
    };

    this.divisionChartOptions = this.defaultChartOptions();
  }

  buildAverageChart(): void {
    const byTicket: Record<string, number> = {};

    this.details.forEach(x => {
      const ticket = x.numeroCC || 'N/A';
      byTicket[ticket] = (byTicket[ticket] || 0) + this.num(x.totalNetCDF);
    });

    const labels = Object.keys(byTicket);
    const values = Object.values(byTicket);

    this.avgChartData = {
      labels,
      datasets: [
        {
          label: 'Prix moyen / transaction FC',
          data: values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,.12)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    this.avgChartOptions = this.defaultChartOptions();
  }

  buildTopArticlesChart(): void {
    const grouped: Record<string, number> = {};

    this.details.forEach(x => {
      const key = x.designation || 'Article';
      grouped[key] = (grouped[key] || 0) + this.num(x.quantiteFacturee);
    });

    const top = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);

    this.topArticlesChartData = {
      labels: top.map(x => x[0]),
      datasets: [
        {
          label: 'Quantité vendue',
          data: top.map(x => x[1]),
          backgroundColor: '#f59e0b',
          borderRadius: 10
        }
      ]
    };

    this.topArticlesChartOptions = {
      ...this.defaultChartOptions(),
      indexAxis: 'y'
    };
  }

  buildStockChart(): void {
    const ruptures = this.stocks
      .filter(x => this.num(x.quantiteDisponible) <= 0)
      .slice(0, 10);

    this.stockChartData = {
      labels: ruptures.map(x => x.nomProduit || x.produitNom || 'Produit'),
      datasets: [
        {
          label: 'Quantité disponible',
          data: ruptures.map(x => this.num(x.quantiteDisponible)),
          backgroundColor: '#ef4444',
          borderRadius: 10
        }
      ]
    };

    this.stockChartOptions = this.defaultChartOptions();
  }

  exportExcel(): void {
    const rows = this.details.map(x => ({
      Ticket: x.numeroCC,
      Date: x.dateCC,
      Client: x.nomClient,
      CST: x.cst,
      Article: x.designation,
      Référence: x.reference,
      Quantité: x.quantiteFacturee,
      'Total net FC': x.totalNetCDF,
      'Total PMP FC': x.totalPmpCDF,
      'Marge FC': x.margeCDF,
      '% Marge': x.pourcentageMarge,
      Taux: x.coursDevise
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard POS');

    XLSX.writeFile(
      wb,
      `Dashboard_POS_${this.dateFrom}_${this.dateTo}.xlsx`
    );
  }

  exportPdf(): void {
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(15);
    doc.text('Dashboard Performance POS', 14, 14);

    doc.setFontSize(9);
    doc.text(`Période : ${this.dateFrom} au ${this.dateTo}`, 14, 21);
    doc.text('Monnaie principale : FC', 14, 27);

    const totalCAFC = this.sum(this.details, 'totalNetCDF');
    const totalMargeFC = this.sum(this.details, 'margeCDF');
    const totalPmpFC = this.sum(this.details, 'totalPmpCDF');

    autoTable(doc, {
      startY: 34,
      head: [['KPI', 'Valeur FC']],
      body: [
        ['Chiffre d’affaires', `${this.formatFc(totalCAFC)} FC`],
        ['Marge brute', `${this.formatFc(totalMargeFC)} FC`],
        ['Valeur PMP', `${this.formatFc(totalPmpFC)} FC`],
        ['Tickets', `${new Set(this.details.map(x => x.numeroCC)).size}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 76, 129] }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [[
        'Ticket',
        'Date',
        'Client',
        'Article',
        'Qté',
        'Total FC',
        'PMP FC',
        'Marge FC',
        '%'
      ]],
      body: this.details.map(x => [
        x.numeroCC,
        this.formatDate(x.dateCC),
        x.nomClient,
        x.designation,
        this.num(x.quantiteFacturee),
        this.formatFc(x.totalNetCDF),
        this.formatFc(x.totalPmpCDF),
        this.formatFc(x.margeCDF),
        `${this.num(x.pourcentageMarge)} %`
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] }
    });

    doc.save(`Dashboard_POS_${this.dateFrom}_${this.dateTo}.pdf`);
  }

  private groupByDateTicket(): Record<string, number> {
    const map: Record<string, Set<string>> = {};

    this.details.forEach(x => {
      const date = this.formatDate(x.dateCC);
      const ticket = x.numeroCC || '';

      if (!map[date]) {
        map[date] = new Set();
      }

      map[date].add(ticket);
    });

    const result: Record<string, number> = {};

    Object.keys(map).forEach(date => {
      result[date] = map[date].size;
    });

    return result;
  }

  private getTauxActif(): number {
    return this.details.find(x => this.num(x.coursDevise) > 0)?.coursDevise || 0;
  }

  private sum(data: any[], field: string): number {
    return data.reduce((acc, x) => acc + this.num(x[field]), 0);
  }

  private num(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  toUsd(montantFc: number, taux: number): number {
    if (!montantFc || !taux || taux <= 0) return 0;
    return +(montantFc / taux).toFixed(2);
  }

  formatFc(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(this.num(value));
  }

  formatUsd(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this.num(value));
  }

  formatDate(value: string): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString('fr-FR');
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private defaultChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#334155'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b' },
          grid: { color: '#e2e8f0' }
        },
        y: {
          ticks: { color: '#64748b' },
          grid: { color: '#e2e8f0' }
        }
      }
    };
  }
}
