import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Users,
  CheckSquare,
  Clock,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  db,
  type Project,
  type Worker,
  type Task,
  type Attendance,
} from "@/lib/database";

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
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
      const [projectsData, workersData, tasksData, attendanceData] =
        await Promise.all([
          db.getAll<Project>("projects"),
          db.getAll<Worker>("workers"),
          db.getAll<Task>("tasks"),
          db.getAll<Attendance>("attendance"),
        ]);

      setProjects(projectsData);
      setWorkers(workersData);
      setTasks(tasksData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeProjectIdsFromTasks = new Set(
    tasks
      .filter((t) => t.status === "pending" || t.status === "in-progress")
      .map((t) => t.projectId)
  );
  const activeProjects = projects.filter(
    (p) => p.status === "active" || activeProjectIdsFromTasks.has(p.id)
  );
  const stats = {
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    totalWorkers: workers.length,
    activeWorkers: workers.filter((w) => w.status === "active").length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    todayAttendance: attendance.filter(
      (a) => new Date(a.date).toDateString() === new Date().toDateString()
    ).length,
    totalHoursToday: attendance
      .filter(
        (a) => new Date(a.date).toDateString() === new Date().toDateString()
      )
      .reduce((sum, a) => sum + a.hoursWorked, 0),
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
    color?: string;
  }> = ({ title, value, icon, subtitle, color = "construction" }) => (
    <Card className="animate-fade-in hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div
          className={`p-2 rounded-lg ${
            color === "construction"
              ? "construction-gradient"
              : "steel-gradient"
          }`}
        >
          <div className="text-white">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-steel">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-steel">Dashboard</h2>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Proyectos Activos"
          value={stats.activeProjects}
          icon={<Briefcase className="h-5 w-5" />}
          subtitle={`${stats.totalProjects} total`}
        />
        <StatCard
          title="Personal Activo"
          value={stats.activeWorkers}
          icon={<Users className="h-5 w-5" />}
          subtitle={`${stats.totalWorkers} total`}
          color="steel"
        />
        <StatCard
          title="Tareas Completadas"
          value={`${stats.completedTasks}/${stats.totalTasks}`}
          icon={<CheckSquare className="h-5 w-5" />}
          subtitle={`${
            Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0
          }% completado`}
        />
        <StatCard
          title="Asistencia Hoy"
          value={stats.todayAttendance}
          icon={<Clock className="h-5 w-5" />}
          subtitle={`${stats.totalHoursToday.toFixed(1)} horas`}
          color="steel"
        />
      </div>

      {/* Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-construction" />
              <span>Proyectos en Progreso</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-steel">{project.name}</h4>
                    <span className="text-sm text-gray-500">
                      {project.progress}%
                    </span>
                  </div>
                  <Progress value={project.progress} className="mb-2" />
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{project.location}</span>
                    <span>
                      {new Date(project.endDate).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No hay proyectos activos
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-construction" />
              <span>Tareas Pendientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks
                .filter(
                  (t) => t.status === "pending" || t.status === "in-progress"
                )
                .slice(0, 4)
                .map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      className="border-l-4 border-construction pl-4 py-2"
                    >
                      <h4 className="font-medium text-steel">{task.title}</h4>
                      <p className="text-sm text-gray-600">{project?.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(task.dueDate).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              {tasks.filter(
                (t) => t.status === "pending" || t.status === "in-progress"
              ).length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No hay tareas pendientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-construction" />
            <span>Acciones Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => onNavigate && onNavigate("projects")}
            >
              <Briefcase className="h-8 w-8 text-construction mb-2" />
              <h3 className="font-medium text-steel">Nuevo Proyecto</h3>
              <p className="text-sm text-gray-500">
                Crear un proyecto de construcción
              </p>
            </button>
            <button
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => onNavigate && onNavigate("workers")}
            >
              <Users className="h-8 w-8 text-construction mb-2" />
              <h3 className="font-medium text-steel">Registrar Personal</h3>
              <p className="text-sm text-gray-500">Añadir nuevo trabajador</p>
            </button>
            <button
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => onNavigate && onNavigate("attendance")}
            >
              <Clock className="h-8 w-8 text-construction mb-2" />
              <h3 className="font-medium text-steel">Marcar Asistencia</h3>
              <p className="text-sm text-gray-500">Registrar entrada/salida</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
