import { Component } from '@angular/core';
import { RequisitionService } from '../../service/requisition/requisition-service';

@Component({
  selector: 'app-analyse-achats-component',
  templateUrl: './analyse-achats-component.html',
  styleUrl: './analyse-achats-component.css',
  standalone : false,


})
export class AnalyseAchatsComponent {

  data: any[] = [];

  totalDemandes = 0;
  totalVentes = 0;
  totalManques = 0;
  tauxSatisfaction = 0;
  tauxManque = 0;

  dateFrom!: string;
  dateTo!: string;

  constructor(private service: RequisitionService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(res => {
      this.data = res;

      this.totalDemandes = this.sum(res, 'totalDemandes');
      this.totalVentes = this.sum(res, 'totalVentes');
      this.totalManques = this.sum(res, 'totalVentesManquees');

      if (this.totalDemandes > 0) {
        this.tauxSatisfaction = Math.round((this.totalVentes / this.totalDemandes) * 100);
        this.tauxManque = Math.round((this.totalManques / this.totalDemandes) * 100);
      }
    });
  }

  sum(data: any[], field: string): number {
    return data.reduce((acc, x) => acc + (x[field] || 0), 0);
  }
}
