import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  db,
  type Worker,
  type Project,
  type Attendance,
  type Task,
} from "@/lib/database";
import { v4 as uuidv4 } from "uuid";
import { pdfGenerator } from "@/lib/pdf-generator";

const attendanceSchema = z.object({
  workerId: z.string().min(1, "Trabajador es requerido"),
  projectId: z.string().min(1, "Proyecto es requerido"),
  taskId: z.string().min(1, "Tarea es requerida"),
  date: z.string().min(1, "Fecha es requerida"),
  checkIn: z.string().min(1, "Hora de entrada es requerida"),
  checkOut: z.string().optional(),
  hoursWorked: z.coerce.number().min(0, "Las horas deben ser positivas"),
  notes: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceFormValues[]>([
    {
      workerId: "",
      projectId: "",
      taskId: "",
      date: new Date().toISOString().split("T")[0],
      checkIn: "08:00",
      checkOut: "",
      hoursWorked: 0,
      notes: "",
    },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attendanceData, workersData, projectsData, tasksData] =
        await Promise.all([
          db.getAll<Attendance>("attendance"),
          db.getAll<Worker>("workers"),
          db.getAll<Project>("projects"),
          db.getAll<Task>("tasks"),
        ]);
      setAttendance(attendanceData);
      setWorkers(workersData);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    setAttendanceRows([
      ...attendanceRows,
      {
        workerId: "",
        projectId: "",
        taskId: "",
        date: new Date().toISOString().split("T")[0],
        checkIn: "08:00",
        checkOut: "",
        hoursWorked: 0,
        notes: "",
      },
    ]);
  };

  const removeRow = (idx: number) => {
    setAttendanceRows(attendanceRows.filter((_, i) => i !== idx));
  };

  const updateRow = (
    idx: number,
    field: keyof AttendanceFormValues,
    value: string | number
  ) => {
    setAttendanceRows((rows) =>
      rows.map((row, i) =>
        i === idx
          ? {
              ...row,
              [field]: value,
              ...(field === "projectId" ? { taskId: "" } : {}),
            }
          : row
      )
    );
  };

  const onSubmitRows = async () => {
    try {
      for (const data of attendanceRows) {
        if (
          !data.workerId ||
          !data.projectId ||
          !data.taskId ||
          !data.date ||
          !data.hoursWorked
        )
          continue;
        const attendanceData: Attendance & { taskId?: string } = {
          id: editingId || uuidv4(),
          workerId: data.workerId,
          projectId: data.projectId,
          date: data.date,
          checkIn: data.checkIn,
          checkOut: data.checkOut || undefined,
          hoursWorked: data.hoursWorked,
          notes: data.notes || undefined,
          createdAt: new Date().toISOString(),
          taskId: data.taskId,
        };
        if (editingId) {
          await db.update("attendance", attendanceData);
        } else {
          await db.add("attendance", attendanceData);
        }
      }
      setAttendanceRows([
        {
          workerId: "",
          projectId: "",
          taskId: "",
          date: new Date().toISOString().split("T")[0],
          checkIn: "08:00",
          checkOut: "",
          hoursWorked: 0,
          notes: "",
        },
      ]);
      setEditingId(null);
      await loadData();
      toast.success("Asistencia registrada correctamente");
    } catch (error) {
      toast.error("Error al guardar la asistencia");
    }
  };

  const handleEdit = (record: Attendance & { taskId?: string }) => {
    setAttendanceRows([
      {
        workerId: record.workerId,
        projectId: record.projectId,
        taskId: (record as any).taskId || "",
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut || "",
        hoursWorked: record.hoursWorked,
        notes: record.notes || "",
      },
    ]);
    setEditingId(record.id);
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm("¿Estás seguro de que quieres eliminar este registro?")
    ) {
      try {
        await db.delete("attendance", id);
        await loadData();
        toast.success("Registro eliminado correctamente");
      } catch (error) {
        toast.error("Error al eliminar el registro");
      }
    }
  };

  const getTasksForProject = (projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId);
  };

  const handleGenerateReport = async () => {
    try {
      const pdfBlob = pdfGenerator.generateAttendanceReport(
        attendance,
        workers,
        projects
      );

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asistencia-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Reporte generado correctamente");
    } catch (error) {
      console.error("Error generando reporte:", error);
      toast.error("Error al generar el reporte");
    }
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-steel">Control de Asistencia</h2>
        <Button
          variant="outline"
          onClick={handleGenerateReport}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Generar Reporte
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Registrar Asistencia de Trabajadores</CardTitle>
          <CardDescription>
            Agrega una fila por cada trabajador, proyecto y horas trabajadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitRows();
            }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th>Trabajador</th>
                    <th>Proyecto</th>
                    <th>Tarea</th>
                    <th>Fecha</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Horas</th>
                    <th>Notas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          value={row.workerId}
                          onChange={(e) =>
                            updateRow(idx, "workerId", e.target.value)
                          }
                          className="border rounded p-1"
                          title="Selecciona el trabajador"
                        >
                          <option value="">Selecciona</option>
                          {workers.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={row.projectId}
                          onChange={(e) =>
                            updateRow(idx, "projectId", e.target.value)
                          }
                          className="border rounded p-1"
                          title="Selecciona el proyecto"
                        >
                          <option value="">Selecciona</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={row.taskId}
                          onChange={(e) =>
                            updateRow(idx, "taskId", e.target.value)
                          }
                          className="border rounded p-1"
                          title="Selecciona la tarea"
                          disabled={!row.projectId}
                        >
                          <option value="">Selecciona</option>
                          {getTasksForProject(row.projectId).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) =>
                            updateRow(idx, "date", e.target.value)
                          }
                          className="border rounded p-1"
                          title="Selecciona la fecha"
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={row.checkIn}
                          onChange={(e) =>
                            updateRow(idx, "checkIn", e.target.value)
                          }
                          className="border rounded p-1"
                          title="Hora de entrada"
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={row.checkOut}
                          onChange={(e) =>
                            updateRow(idx, "checkOut", e.target.value)
                          }
                          className="border rounded p-1"
                          title="Hora de salida"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.hoursWorked}
                          onChange={(e) =>
                            updateRow(
                              idx,
                              "hoursWorked",
                              Number(e.target.value)
                            )
                          }
                          className="border rounded p-1 w-16"
                          min="0"
                          step="0.25"
                          title="Horas trabajadas"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.notes}
                          onChange={(e) =>
                            updateRow(idx, "notes", e.target.value)
                          }
                          className="border rounded p-1"
                          title="Notas"
                        />
                      </td>
                      <td>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(idx)}
                        >
                          -
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="button" onClick={addRow} variant="outline">
                Añadir Fila
              </Button>
              <Button
                type="submit"
                className="construction-gradient text-white"
              >
                Registrar Asistencia
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-construction" />
              <span>Registros de Asistencia</span>
            </div>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
              {attendance.length} registros
            </span>
          </CardTitle>
          <CardDescription>
            Historial de asistencia del personal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No hay registros de asistencia</p>
              <Button
                className="mt-4 construction-gradient text-white"
                onClick={addRow}
              >
                <Plus className="h-4 w-4 mr-2" /> Registrar primera asistencia
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {attendance
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .slice(0, 10) // Mostrar solo los últimos 10 registros
                .map((record) => {
                  const worker = workers.find((w) => w.id === record.workerId);
                  const project = projects.find(
                    (p) => p.id === record.projectId
                  );
                  const task = tasks.find(
                    (t) => t.id === (record as any).taskId
                  );

                  return (
                    <div
                      key={record.id}
                      className="border-l-4 border-construction pl-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-steel">
                              {worker?.name || "Desconocido"}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600">
                            {project?.name || "Desconocido"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {task ? `Tarea: ${task.title}` : "Sin tarea"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(record)}
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(record.id)}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                        <div>
                          <span className="text-gray-500">Fecha: </span>
                          {new Date(record.date).toLocaleDateString("es-ES")}
                        </div>
                        <div>
                          <span className="text-gray-500">Entrada: </span>
                          {record.checkIn}
                        </div>
                        <div>
                          <span className="text-gray-500">Salida: </span>
                          {record.checkOut || "Sin registrar"}
                        </div>
                      </div>
                      <div className="text-xs mt-1">
                        <span className="text-gray-500">Horas: </span>
                        <span className="font-medium">
                          {record.hoursWorked}
                        </span>
                      </div>
                      {record.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          "{record.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
