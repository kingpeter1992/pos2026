import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



@Injectable({
  providedIn: 'root',
})
export class Export {



exportToPDF(data: any[], fileName: string): void {
  if (!data || data.length === 0) return;

  const doc = new jsPDF('landscape');
  const columns = Object.keys(data[0]);

  // ✅ Forcer le typage
  const rows: (string | number)[][] = data.map(obj =>
    columns.map(col => obj[col] ?? '')
  );

  autoTable(doc, {
    head: [columns],
    body: rows,
    styles: { fontSize: 9 },
    theme: 'striped'
  });

  doc.save(`${fileName}.pdf`);
}


 exportToExcel(
    data: any[],
    fileName: string,
    sheetName: string = 'Données'
  ): void {

    if (!data || data.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // 🎨 Largeur automatique des colonnes
    worksheet['!cols'] = Object.keys(data[0]).map(() => ({ wch: 20 }));

    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName]
    };

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob(
      [excelBuffer],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' }
    );

    saveAs(blob, `${fileName}.xlsx`);
  }
}
