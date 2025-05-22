
import jsPDF from 'jspdf';
import { BasePDFGenerator } from './base-generator';
import type { Project, Worker, Task } from '../database';

export class ProjectReportGenerator extends BasePDFGenerator {
  generateReport(project: Project, tasks: Task[], workers: Worker[]): Blob {
    this.doc = new jsPDF();
    this.addHeader(`Reporte de Proyecto: ${project.name}`);

    let yPosition = 60;

    // Project details
    this.doc.setFontSize(14);
    this.doc.setTextColor(44, 62, 80);
    this.doc.text('Detalles del Proyecto', 20, yPosition);
    yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const projectDetails = [
      `Descripción: ${project.description}`,
      `Ubicación: ${project.location}`,
      `Fecha de inicio: ${new Date(project.startDate).toLocaleDateString('es-ES')}`,
      `Fecha de fin: ${new Date(project.endDate).toLocaleDateString('es-ES')}`,
      `Estado: ${project.status}`,
      `Progreso: ${project.progress}%`,
      `Presupuesto: $${project.budget.toLocaleString()}`
    ];

    projectDetails.forEach(detail => {
      this.doc.text(detail, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Tasks table
    if (tasks.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setTextColor(44, 62, 80);
      this.doc.text('Tareas del Proyecto', 20, yPosition);
      yPosition += 10;

      const taskData = tasks.map(task => [
        task.title,
        task.status,
        task.priority,
        `${task.progress}%`,
        new Date(task.dueDate).toLocaleDateString('es-ES')
      ]);

      this.doc.autoTable({
        startY: yPosition,
        head: [['Tarea', 'Estado', 'Prioridad', 'Progreso', 'Fecha límite']],
        body: taskData,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 53] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      yPosition = this.doc.lastAutoTable.finalY + 20;
    }

    // Workers assigned
    if (workers.length > 0) {
      if (yPosition > 250) {
        this.doc.addPage();
        yPosition = 20;
      }

      this.doc.setFontSize(14);
      this.doc.setTextColor(44, 62, 80);
      this.doc.text('Personal Asignado', 20, yPosition);
      yPosition += 10;

      const workerData = workers.map(worker => [
        worker.name,
        worker.role,
        worker.email,
        worker.phone,
        `$${worker.hourlyRate}/hora`
      ]);

      this.doc.autoTable({
        startY: yPosition,
        head: [['Nombre', 'Cargo', 'Email', 'Teléfono', 'Tarifa']],
        body: workerData,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 53] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
    }

    return this.doc.output('blob');
  }
}
