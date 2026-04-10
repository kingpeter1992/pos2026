import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Toast } from '../../../shares/services/toast/toast';
import {  ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js/auto';
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

  kpis = [
    {
      label: 'Vente par heure de travail',
      value: '$273.80',
      icon: 'pi pi-dollar',
      trend: '+8.2%'
    },
    {
      label: 'Ventes totales tous départements',
      value: '$1.22M',
      icon: 'pi pi-chart-line',
      trend: '+12.4%'
    },
    {
      label: 'Vente moyenne par unité',
      value: '$5.44',
      icon: 'pi pi-box',
      trend: '+2.1%'
    },
    {
      label: 'Revenu moyen par heure',
      value: '$178.67',
      icon: 'pi pi-clock',
      trend: '+5.7%'
    }
  ];

  ngOnInit(): void {
    this.initCharts();
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

    this.customersChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Visiteurs',
          backgroundColor: palette.accent,
          borderRadius: 4,
          data: [24, 45, 86, 60, 18, 36, 64, 86, 24, 48, 36, 66]
        },
        {
          label: 'Transactions',
          backgroundColor: palette.secondary,
          borderRadius: 4,
          data: [20, 30, 26, 18, 35, 46, 86, 67, 86, 26, 72, 18]
        }
      ]
    };

    this.customersChartOptions = this.buildBarOptions(textColor, gridColor);

    this.divisionChartData = {
      labels: ['Femmes', 'Hommes', 'Enfants'],
      datasets: [
        {
          label: 'Ventes par division',
          backgroundColor: [palette.secondary, palette.accent, '#90a4ae'],
          borderRadius: 6,
          data: [45, 65, 50]
        }
      ]
    };

    this.divisionChartOptions = this.buildSimpleBarOptions(textColor, gridColor);

    this.avgChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          type: 'line',
          label: 'Prix / transaction',
          borderColor: palette.accent,
          backgroundColor: palette.accent,
          tension: 0.35,
          fill: false,
          data: [18, 32, 28, 22, 35, 50, 45, 68, 82, 48, 40, 66]
        },
        {
          type: 'line',
          label: 'Unités / transaction',
          borderColor: palette.secondary,
          backgroundColor: palette.secondary,
          tension: 0.35,
          fill: false,
          data: [48, 66, 52, 36, 18, 38, 84, 28, 42, 30, 72, 22]
        }
      ]
    };

    this.avgChartOptions = this.buildLineOptions(textColor, gridColor);

    this.topArticlesChartData = {
      labels: ['Article A', 'Article B', 'Article C', 'Article D', 'Article E', 'Article F', 'Article G'],
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
          data: [45, 65, 50, 28, 15, 35, 72]
        }
      ]
    };

    this.topArticlesChartOptions = this.buildSimpleBarOptions(textColor, gridColor);

    this.cityChartData = {
      labels: ['Lubumbashi', 'Kinshasa', 'Likasi', 'Kolwezi', 'Goma', 'Matadi', 'Mbuji-Mayi'],
      datasets: [
        {
          data: [18, 24, 12, 15, 10, 8, 13],
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

    this.stockChartData = {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
      datasets: [
        {
          type: 'bar',
          label: 'Niveau stock',
          backgroundColor: '#4db6ac',
          borderRadius: 4,
          data: [15, 32, 27, 18, 36, 50, 45, 68]
        },
        {
          type: 'line',
          label: 'Ruptures',
          borderColor: palette.accent,
          backgroundColor: palette.accent,
          tension: 0.35,
          fill: false,
          data: [45, 65, 50, 28, 18, 35, 86, 24]
        }
      ]
    };

    this.stockChartOptions = this.buildMixedOptions(textColor, gridColor, textMuted);
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
