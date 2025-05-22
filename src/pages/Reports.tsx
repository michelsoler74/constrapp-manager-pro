
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db, type Project, type Worker, type Task, type Attendance } from '@/lib/database';
import { pdfGenerator } from '@/lib/pdf-generator';
import { FileText, Briefcase, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, workersData, tasksData, attendanceData] = await Promise.all([
        db.getAll<Project>('projects'),
        db.getAll<Worker>('workers'),
        db.getAll<Task>('tasks'),
        db.getAll<Attendance>('attendance')
      ]);
      
      setProjects(projectsData);
      setWorkers(workersData);
      setTasks(tasksData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generateProjectReport = async (project: Project) => {
    try {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      
      // Get assigned worker IDs
      const assignedWorkerIds = new Set<string>();
      projectTasks.forEach(task => {
        task.assignedTo.forEach(workerId => {
          assignedWorkerIds.add(workerId);
        });
      });
      
      // Get worker details
      const projectWorkers = workers.filter(w => assignedWorkerIds.has(w.id));
      
      const pdfBlob = pdfGenerator.generateProjectReport(project, projectTasks, projectWorkers);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proyecto-${project.name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Reporte generado correctamente');
    } catch (error) {
      console.error('Error generando reporte de proyecto:', error);
      toast.error('Error al generar el reporte de proyecto');
    }
  };

  const generateWorkerReport = async (worker: Worker) => {
    try {
      const workerAttendance = attendance.filter(a => a.workerId === worker.id);
      const projectIds = Array.from(new Set(workerAttendance.map(a => a.projectId)));
      const workerProjects = projects.filter(p => projectIds.includes(p.id));
      
      const pdfBlob = pdfGenerator.generateWorkerReport(worker, workerAttendance, workerProjects);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trabajador-${worker.name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Reporte generado correctamente');
    } catch (error) {
      console.error('Error generando reporte de trabajador:', error);
      toast.error('Error al generar el reporte de trabajador');
    }
  };

  const generateAttendanceReport = async () => {
    try {
      const pdfBlob = pdfGenerator.generateAttendanceReport(attendance, workers, projects);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asistencia-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Reporte de asistencia generado correctamente');
    } catch (error) {
      console.error('Error generando reporte de asistencia:', error);
      toast.error('Error al generar el reporte de asistencia');
    }
  };

  // Prepare data for charts
  const prepareProjectProgressData = () => {
    return projects
      .filter(p => p.status === 'active')
      .map(project => ({
        name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
        progress: project.progress,
      }));
  };

  const prepareTaskStatusData = () => {
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return [
      { name: 'Pendientes', valor: statusCounts['pending'] || 0 },
      { name: 'En Progreso', valor: statusCounts['in-progress'] || 0 },
      { name: 'Completadas', valor: statusCounts['completed'] || 0 },
    ];
  };

  const prepareWorkerAttendanceData = () => {
    const workerAttendanceCounts: Record<string, number> = {};
    
    attendance.forEach(record => {
      workerAttendanceCounts[record.workerId] = (workerAttendanceCounts[record.workerId] || 0) + 1;
    });
    
    return Object.entries(workerAttendanceCounts)
      .map(([workerId, count]) => {
        const worker = workers.find(w => w.id === workerId);
        return {
          name: worker ? (worker.name.length > 15 ? worker.name.substring(0, 15) + '...' : worker.name) : 'Desconocido',
          registros: count,
        };
      })
      .sort((a, b) => b.registros - a.registros)
      .slice(0, 5); // Top 5
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-steel">Reportes y Análisis</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-construction" />
              Reportes de Proyectos
            </CardTitle>
            <CardDescription>
              Generar reportes detallados de proyectos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto">
              <div className="space-y-2">
                {projects.length === 0 ? (
                  <p className="text-center text-gray-500">No hay proyectos registrados</p>
                ) : (
                  projects.map(project => (
                    <div
                      key={project.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-construction" />
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateProjectReport(project)}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        Generar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-construction" />
              Reportes de Personal
            </CardTitle>
            <CardDescription>
              Generar reportes detallados de trabajadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto">
              <div className="space-y-2">
                {workers.length === 0 ? (
                  <p className="text-center text-gray-500">No hay trabajadores registrados</p>
                ) : (
                  workers.map(worker => (
                    <div
                      key={worker.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-construction" />
                        <div>
                          <span className="font-medium block">{worker.name}</span>
                          <span className="text-xs text-gray-500">{worker.role}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateWorkerReport(worker)}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        Generar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-construction" />
              Reporte de Asistencia General
            </CardTitle>
            <CardDescription>
              Generar reporte completo de asistencia de todos los trabajadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm mb-1">
                  <span className="text-gray-600">Total de registros: </span>
                  <span className="font-medium">{attendance.length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Trabajadores con asistencia: </span>
                  <span className="font-medium">
                    {new Set(attendance.map(a => a.workerId)).size}
                  </span>
                </div>
              </div>
              <Button
                onClick={generateAttendanceReport}
                className="construction-gradient text-white"
                disabled={attendance.length === 0}
              >
                <Clock className="h-4 w-4 mr-2" />
                Generar Reporte de Asistencia
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progreso de Proyectos</CardTitle>
            <CardDescription>
              Progreso actual de los proyectos activos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {projects.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareProjectProgressData()}
                    margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      label={{ value: 'Progreso (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                    />
                    <Tooltip formatter={(value) => [`${value}%`, 'Progreso']} />
                    <Legend />
                    <Bar dataKey="progress" fill="#FF6B35" name="Progreso %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No hay datos para mostrar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Tareas</CardTitle>
            <CardDescription>
              Distribución de tareas por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {tasks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareTaskStatusData()}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="valor" fill="#2C3E50" name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No hay datos para mostrar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
