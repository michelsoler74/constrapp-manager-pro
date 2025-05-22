
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF type to include the autoTable method
declare global {
  interface Window {
    jspdf: any;
  }
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export abstract class BasePDFGenerator {
  protected doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  protected addHeader(title: string): void {
    this.doc.setFontSize(20);
    this.doc.setTextColor(255, 107, 53); // Construction orange
    this.doc.text('ConstrAPP - Gestión Pro', 20, 20);
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(44, 62, 80); // Steel blue
    this.doc.text(title, 20, 35);
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 20, 45);
    
    // Add line separator
    this.doc.setDrawColor(255, 107, 53);
    this.doc.line(20, 50, 190, 50);
  }
}
