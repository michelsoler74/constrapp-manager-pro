import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db, type Task, type Project, type Worker } from "@/lib/database";
import { v4 as uuidv4 } from "uuid";
import SpeechInput from "@/components/SpeechInput";
import { Progress } from "@/components/ui/progress";
import MaterialsForm, { type Material } from "@/components/MaterialsForm";

const taskSchema = z.object({
  projectId: z.string().min(1, "Proyecto es requerido"),
  title: z.string().min(1, "Título de la tarea es requerido"),
  description: z.string().min(1, "Descripción es requerida"),
  assignedTo: z.array(z.string()).optional().default([]),
  status: z.enum(["pending", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().min(1, "Fecha límite es requerida"),
  progress: z.coerce.number().min(0).max(100),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [taskMaterials, setTaskMaterials] = useState<Material[]>([]);
  const [taskImages, setTaskImages] = useState<string[]>([]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      assignedTo: [],
      status: "pending",
      priority: "medium",
      dueDate: new Date().toISOString().split("T")[0],
      progress: 0,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, projectsData, workersData] = await Promise.all([
        db.getAll<Task>("tasks"),
        db.getAll<Project>("projects"),
        db.getAll<Worker>("workers"),
      ]);

      setTasks(tasksData);
      setProjects(projectsData);
      setWorkers(workersData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TaskFormValues) => {
    try {
      const taskData: Task = {
        id: editing || uuidv4(),
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        assignedTo: data.assignedTo || [],
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        progress: data.progress,
        createdAt: editing
          ? tasks.find((t) => t.id === editing)?.createdAt ||
            new Date().toISOString()
          : new Date().toISOString(),
        materials: taskMaterials,
        images: taskImages,
      };

      if (editing) {
        await db.update("tasks", taskData);
        toast.success("Tarea actualizada correctamente");
      } else {
        await db.add("tasks", taskData);
        toast.success("Tarea creada correctamente");
      }

      form.reset();
      setEditing(null);
      setTaskMaterials([]);
      setTaskImages([]);
      await loadData();
    } catch (error) {
      console.error("Error guardando tarea:", error);
      toast.error("Error al guardar la tarea");
    }
  };

  const handleEdit = (task: Task) => {
    setEditing(task.id);
    setTaskMaterials(task.materials || []);
    setTaskImages(task.images || []);
    form.reset({
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo || [],
      status: task.status,
      priority: task.priority,
      dueDate: new Date(task.dueDate).toISOString().split("T")[0],
      progress: task.progress,
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setTaskMaterials([]);
    setTaskImages([]);
    form.reset();
  };

  const handleVoiceInput = (
    field: keyof TaskFormValues,
    transcript: string
  ) => {
    const currentValue = form.getValues(field);
    const newValue = currentValue
      ? `${currentValue} ${transcript}`
      : transcript;
    form.setValue(field, newValue);
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      try {
        await db.delete("tasks", taskId);
        toast.success("Tarea eliminada correctamente");
        await loadData();
      } catch (error) {
        toast.error("Error al eliminar la tarea");
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    Promise.all(
      fileArray.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    ).then((images) => {
      setTaskImages((prev) => [...prev, ...images]);
    });
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
      <h2 className="text-2xl font-bold mb-6 text-steel">Gestión de Tareas</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-construction" />
              {editing ? "Editar Tarea" : "Nueva Tarea"}
            </CardTitle>
            <CardDescription>
              {editing
                ? "Actualiza la información de la tarea"
                : "Crea una nueva tarea para un proyecto"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyecto</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un proyecto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título de la Tarea</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-end">
                          <Input
                            placeholder="Título"
                            {...field}
                            className="flex-1"
                          />
                          <SpeechInput
                            onResult={(transcript) =>
                              handleVoiceInput("title", transcript)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Descripción de la tarea"
                            {...field}
                          />
                          <div className="flex justify-end">
                            <SpeechInput
                              onResult={(transcript) =>
                                handleVoiceInput("description", transcript)
                              }
                              placeholder="Dictar descripción"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignado a</FormLabel>
                      <FormControl>
                        <select
                          multiple
                          className="w-full border rounded p-2"
                          value={field.value}
                          onChange={(e) => {
                            const selected = Array.from(
                              e.target.selectedOptions,
                              (option) => option.value
                            );
                            field.onChange(selected);
                          }}
                        >
                          {workers.map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name} - {worker.role}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <MaterialsForm
                  materials={taskMaterials}
                  onMaterialsChange={setTaskMaterials}
                />

                <div className="mb-4">
                  <label className="text-sm font-medium block mb-1">
                    Fotos de la tarea (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                  {taskImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {taskImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Tarea foto ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="in-progress">
                              En Progreso
                            </SelectItem>
                            <SelectItem value="completed">
                              Completada
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Límite</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progreso ({field.value}%)</FormLabel>
                        <FormControl>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  {editing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="construction-gradient text-white"
                  >
                    {editing ? "Actualizar Tarea" : "Crear Tarea"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-construction" />
                <span>Tareas</span>
              </div>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                {tasks.length} tareas
              </span>
            </CardTitle>
            <CardDescription>Lista de tareas de los proyectos</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay tareas registradas</p>
                <Button
                  className="mt-4 construction-gradient text-white"
                  onClick={() => form.setFocus("title")}
                >
                  <Plus className="h-4 w-4 mr-2" /> Crear primera tarea
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const assignedWorkers = workers.filter((w) =>
                    task.assignedTo.includes(w.id)
                  );

                  return (
                    <div
                      key={task.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-steel">
                            {task.title}
                          </h3>
                          <p className="text-sm text-construction">
                            {project?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {task.priority === "high"
                              ? "Alta"
                              : task.priority === "medium"
                              ? "Media"
                              : "Baja"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(task)}
                          >
                            <Edit className="h-4 w-4 text-construction" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {task.description}
                      </p>

                      <div className="mt-2 mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progreso</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mt-4">
                        <div>
                          <span className="text-gray-500">Estado: </span>
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "in-progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.status === "completed"
                              ? "Completada"
                              : task.status === "in-progress"
                              ? "En progreso"
                              : "Pendiente"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fecha límite: </span>
                          {new Date(task.dueDate).toLocaleDateString("es-ES")}
                        </div>
                      </div>

                      {assignedWorkers.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-gray-500">Asignado a: </span>
                          {assignedWorkers.map((w) => w.name).join(", ")}
                        </div>
                      )}

                      {task.materials && task.materials.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="font-medium">Materiales:</span>
                          <ul className="list-disc ml-5">
                            {task.materials.map((material) => (
                              <li key={material.id}>
                                {material.name} ({material.quantity}{" "}
                                {material.unit})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {task.images && task.images.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {task.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Tarea foto ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tasks;
