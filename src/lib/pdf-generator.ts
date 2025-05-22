
import { ProjectReportGenerator } from './pdf/project-report';
import { AttendanceReportGenerator } from './pdf/attendance-report';
import { WorkerReportGenerator } from './pdf/worker-report';
import type { Project, Worker, Task, Attendance } from './database';

class PDFGenerator {
  private projectReporter: ProjectReportGenerator;
  private attendanceReporter: AttendanceReportGenerator;
  private workerReporter: WorkerReportGenerator;

  constructor() {
    this.projectReporter = new ProjectReportGenerator();
    this.attendanceReporter = new AttendanceReportGenerator();
    this.workerReporter = new WorkerReportGenerator();
  }

  generateProjectReport(project: Project, tasks: Task[], workers: Worker[]): Blob {
    return this.projectReporter.generateReport(project, tasks, workers);
  }

  generateAttendanceReport(attendance: Attendance[], workers: Worker[], projects: Project[]): Blob {
    return this.attendanceReporter.generateReport(attendance, workers, projects);
  }

  generateWorkerReport(worker: Worker, attendance: Attendance[], projects: Project[]): Blob {
    return this.workerReporter.generateReport(worker, attendance, projects);
  }
}

export const pdfGenerator = new PDFGenerator();

