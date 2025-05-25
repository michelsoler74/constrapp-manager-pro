import jsPDF from "jspdf";
import { BasePDFGenerator } from "./base-generator";
import type { Project, Worker, Task } from "../database";

export class ProjectReportGenerator extends BasePDFGenerator {
  generateReport(project: Project, tasks: Task[], workers: Worker[]): Blob {
    this.doc = new jsPDF();
    this.addHeader(`Reporte de Proyecto: ${project.name}`);

    let yPosition = 60;

    // Project details
    this.doc.setFontSize(14);
    this.doc.setTextColor(44, 62, 80);
    this.doc.text("Detalles del Proyecto", 20, yPosition);
    yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const projectDetails = [
      `Descripción: ${project.description}`,
      `Ubicación: ${project.location}`,
      `Fecha de inicio: ${new Date(project.startDate).toLocaleDateString(
        "es-ES"
      )}`,
      `Fecha de fin: ${new Date(project.endDate).toLocaleDateString("es-ES")}`,
      `Estado: ${project.status}`,
      `Progreso: ${project.progress}%`,
      `Presupuesto: $${project.budget.toLocaleString()}`,
    ];

    projectDetails.forEach((detail) => {
      this.doc.text(detail, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Tasks table
    if (tasks.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setTextColor(44, 62, 80);
      this.doc.text("Tareas del Proyecto", 20, yPosition);
      yPosition += 10;

      const taskData = tasks.map((task) => [
        task.title,
        task.status,
        task.priority,
        `${task.progress}%`,
        new Date(task.dueDate).toLocaleDateString("es-ES"),
      ]);

      this.doc.autoTable({
        startY: yPosition,
        head: [["Tarea", "Estado", "Prioridad", "Progreso", "Fecha límite"]],
        body: taskData,
        theme: "grid",
        headStyles: { fillColor: [255, 107, 53] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      yPosition = this.doc.lastAutoTable.finalY + 10;

      // Agregar materiales de cada tarea
      this.doc.setFontSize(12);
      this.doc.setTextColor(44, 62, 80);
      tasks.forEach((task) => {
        if (task.materials && task.materials.length > 0) {
          if (yPosition > 250) {
            this.doc.addPage();
            yPosition = 20;
          }
          this.doc.text(
            `Materiales para la tarea: ${task.title}`,
            20,
            yPosition
          );
          yPosition += 7;
          const materialData = task.materials.map((mat) => [
            mat.name,
            mat.quantity,
            mat.supplier || "",
            mat.cost ? `€${mat.cost}` : "",
          ]);
          this.doc.autoTable({
            startY: yPosition,
            head: [["Nombre", "Cantidad", "Proveedor", "Costo"]],
            body: materialData,
            theme: "plain",
            headStyles: { fillColor: [200, 200, 200] },
            styles: { fontSize: 9 },
            margin: { left: 20, right: 20 },
          });
          yPosition = this.doc.lastAutoTable.finalY + 7;
        }
        // Agregar imágenes de la tarea
        if (task.images && task.images.length > 0) {
          if (yPosition > 230) {
            this.doc.addPage();
            yPosition = 20;
          }
          this.doc.setFontSize(11);
          this.doc.setTextColor(44, 62, 80);
          this.doc.text(`Fotos de la tarea: ${task.title}`, 20, yPosition);
          yPosition += 7;
          let x = 20;
          const maxPerRow = 6;
          let count = 0;
          task.images.forEach((img) => {
            try {
              this.doc.addImage(img, "JPEG", x, yPosition, 22, 22);
            } catch (e) {
              // Si la imagen no es JPEG, intenta PNG
              try {
                this.doc.addImage(img, "PNG", x, yPosition, 22, 22);
              } catch (e2) {
                // Si falla, ignora la imagen
              }
            }
            x += 25;
            count++;
            if (count % maxPerRow === 0) {
              x = 20;
              yPosition += 25;
            }
          });
          yPosition += 30;
        }
      });
    }

    // Workers assigned
    if (workers.length > 0) {
      if (yPosition > 250) {
        this.doc.addPage();
        yPosition = 20;
      }

      this.doc.setFontSize(14);
      this.doc.setTextColor(44, 62, 80);
      this.doc.text("Personal Asignado", 20, yPosition);
      yPosition += 10;

      const workerData = workers.map((worker) => [
        worker.name,
        worker.role,
        worker.email,
        worker.phone,
        `$${worker.hourlyRate}/hora`,
      ]);

      this.doc.autoTable({
        startY: yPosition,
        head: [["Nombre", "Cargo", "Email", "Teléfono", "Tarifa"]],
        body: workerData,
        theme: "grid",
        headStyles: { fillColor: [255, 107, 53] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    }

    return this.doc.output("blob");
  }
}
