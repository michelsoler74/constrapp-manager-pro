
import jsPDF from 'jspdf';
import { BasePDFGenerator } from './base-generator';
import type { Attendance, Worker, Project } from '../database';

export class AttendanceReportGenerator extends BasePDFGenerator {
  generateReport(attendance: Attendance[], workers: Worker[], projects: Project[]): Blob {
    this.doc = new jsPDF();
    this.addHeader('Reporte de Asistencia');

    let yPosition = 60;

    // Summary
    this.doc.setFontSize(14);
    this.doc.setTextColor(44, 62, 80);
    this.doc.text('Resumen de Asistencia', 20, yPosition);
    yPosition += 10;

    const totalHours = attendance.reduce((sum, record) => sum + record.hoursWorked, 0);
    const uniqueWorkers = new Set(attendance.map(record => record.workerId)).size;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Total de horas trabajadas: ${totalHours.toFixed(2)}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Trabajadores únicos: ${uniqueWorkers}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Registros de asistencia: ${attendance.length}`, 20, yPosition);
    yPosition += 20;

    // Attendance table
    if (attendance.length > 0) {
      const attendanceData = attendance.map(record => {
        const worker = workers.find(w => w.id === record.workerId);
        const project = projects.find(p => p.id === record.projectId);
        
        return [
          worker?.name || 'Desconocido',
          project?.name || 'Desconocido',
          new Date(record.date).toLocaleDateString('es-ES'),
          record.checkIn,
          record.checkOut || 'Sin salida',
          record.hoursWorked.toFixed(2),
          record.notes || ''
        ];
      });

      this.doc.autoTable({
        startY: yPosition,
        head: [['Trabajador', 'Proyecto', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Notas']],
        body: attendanceData,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 53] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          6: { cellWidth: 30 }
        }
      });
    }

    return this.doc.output('blob');
  }
}
