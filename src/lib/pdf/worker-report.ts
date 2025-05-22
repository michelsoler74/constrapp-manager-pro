
import jsPDF from 'jspdf';
import { BasePDFGenerator } from './base-generator';
import type { Worker, Attendance, Project } from '../database';

export class WorkerReportGenerator extends BasePDFGenerator {
  generateReport(worker: Worker, attendance: Attendance[], projects: Project[]): Blob {
    this.doc = new jsPDF();
    this.addHeader(`Reporte de Trabajador: ${worker.name}`);

    let yPosition = 60;

    // Worker details
    this.doc.setFontSize(14);
    this.doc.setTextColor(44, 62, 80);
    this.doc.text('Información Personal', 20, yPosition);
    yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const workerDetails = [
      `Cargo: ${worker.role}`,
      `Email: ${worker.email}`,
      `Teléfono: ${worker.phone}`,
      `Tarifa por hora: $${worker.hourlyRate}`,
      `Estado: ${worker.status}`,
      `Habilidades: ${worker.skills.join(', ')}`
    ];

    workerDetails.forEach(detail => {
      this.doc.text(detail, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 15;

    // Attendance summary
    const totalHours = attendance.reduce((sum, record) => sum + record.hoursWorked, 0);
    const totalDays = attendance.length;
    const totalEarnings = totalHours * worker.hourlyRate;

    this.doc.setFontSize(14);
    this.doc.setTextColor(44, 62, 80);
    this.doc.text('Resumen de Trabajo', 20, yPosition);
    yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Total de días trabajados: ${totalDays}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Total de horas: ${totalHours.toFixed(2)}`, 20, yPosition);
    yPosition += 6;
    this.doc.text(`Total ganado: $${totalEarnings.toFixed(2)}`, 20, yPosition);
    yPosition += 20;

    // Recent attendance
    if (attendance.length > 0) {
      const recentAttendance = attendance.slice(-10); // Last 10 records
      
      const attendanceData = recentAttendance.map(record => {
        const project = projects.find(p => p.id === record.projectId);
        
        return [
          project?.name || 'Desconocido',
          new Date(record.date).toLocaleDateString('es-ES'),
          record.checkIn,
          record.checkOut || 'Sin salida',
          record.hoursWorked.toFixed(2),
          `$${(record.hoursWorked * worker.hourlyRate).toFixed(2)}`
        ];
      });

      this.doc.setFontSize(14);
      this.doc.setTextColor(44, 62, 80);
      this.doc.text('Asistencia Reciente', 20, yPosition);
      yPosition += 10;

      this.doc.autoTable({
        startY: yPosition,
        head: [['Proyecto', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Pago']],
        body: attendanceData,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 53] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
    }

    return this.doc.output('blob');
  }
}
