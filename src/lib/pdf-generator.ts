
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Project, Worker, Task, Attendance } from './database';

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  private addHeader(title: string): void {
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

  generateProjectReport(project: Project, tasks: Task[], workers: Worker[]): Blob {
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

      (this.doc as any).autoTable({
        startY: yPosition,
        head: [['Tarea', 'Estado', 'Prioridad', 'Progreso', 'Fecha límite']],
        body: taskData,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 53] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      yPosition = (this.doc as any).lastAutoTable.finalY + 20;
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

      (this.doc as any).autoTable({
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

  generateAttendanceReport(attendance: Attendance[], workers: Worker[], projects: Project[]): Blob {
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

      (this.doc as any).autoTable({
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

  generateWorkerReport(worker: Worker, attendance: Attendance[], projects: Project[]): Blob {
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

      (this.doc as any).autoTable({
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

export const pdfGenerator = new PDFGenerator();
