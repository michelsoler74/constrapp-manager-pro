
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Briefcase, FileText, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { db, type Project } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import SpeechInput from '@/components/SpeechInput';
import { pdfGenerator } from '@/lib/pdf-generator';

const projectSchema = z.object({
  name: z.string().min(1, 'Nombre del proyecto es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  startDate: z.string().min(1, 'Fecha de inicio es requerida'),
  endDate: z.string().min(1, 'Fecha de fin es requerida'),
  budget: z.coerce.number().positive('El presupuesto debe ser positivo'),
  location: z.string().min(1, 'Ubicación es requerida'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: 0,
      location: '',
    }
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await db.getAll<Project>('projects');
      setProjects(projectsData);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      toast.error('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const projectData: Project = {
        id: editing || uuidv4(),
        ...data,
        status: editing ? 
          projects.find(p => p.id === editing)?.status || 'planning' : 
          'planning',
        progress: editing ? 
          projects.find(p => p.id === editing)?.progress || 0 : 
          0,
        createdAt: editing ? 
          projects.find(p => p.id === editing)?.createdAt || new Date().toISOString() : 
          new Date().toISOString(),
      };

      if (editing) {
        await db.update('projects', projectData);
        toast.success('Proyecto actualizado correctamente');
      } else {
        await db.add('projects', projectData);
        toast.success('Proyecto creado correctamente');
      }

      form.reset();
      setEditing(null);
      await loadProjects();
    } catch (error) {
      console.error('Error guardando proyecto:', error);
      toast.error('Error al guardar el proyecto');
    }
  };

  const handleEdit = (project: Project) => {
    setEditing(project.id);
    form.reset({
      name: project.name,
      description: project.description,
      startDate: new Date(project.startDate).toISOString().split('T')[0],
      endDate: new Date(project.endDate).toISOString().split('T')[0],
      budget: project.budget,
      location: project.location,
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    form.reset();
  };

  const handleVoiceInput = (field: keyof ProjectFormValues, transcript: string) => {
    form.setValue(field, transcript);
  };

  const handleGenerateReport = async (project: Project) => {
    try {
      const tasks = await db.getByIndex<any>('tasks', 'projectId', project.id);
      
      // Get assigned worker IDs
      const assignedWorkerIds = new Set<string>();
      tasks.forEach(task => {
        task.assignedTo.forEach((workerId: string) => {
          assignedWorkerIds.add(workerId);
        });
      });
      
      // Get worker details
      const workers = await Promise.all(
        Array.from(assignedWorkerIds).map(id => db.getById('workers', id))
      );
      
      const pdfBlob = pdfGenerator.generateProjectReport(project, tasks, workers.filter(Boolean) as any[]);
      
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
      console.error('Error generando reporte:', error);
      toast.error('Error al generar el reporte');
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
      <h2 className="text-2xl font-bold mb-6 text-steel">Gestión de Proyectos</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-construction" />
              {editing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </CardTitle>
            <CardDescription>
              {editing 
                ? 'Actualiza la información del proyecto' 
                : 'Completa el formulario para crear un nuevo proyecto'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proyecto</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <Input 
                            placeholder="Nombre del proyecto" 
                            {...field} 
                          />
                          <SpeechInput 
                            onResult={(transcript) => handleVoiceInput('name', transcript)}
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
                        <div className="flex flex-col gap-2">
                          <Textarea 
                            placeholder="Descripción del proyecto" 
                            {...field} 
                          />
                          <div className="flex justify-end">
                            <SpeechInput 
                              onResult={(transcript) => handleVoiceInput('description', transcript)}
                              placeholder="Dictar descripción"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Finalización</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presupuesto</FormLabel>
                        <FormControl>
                          <div className="flex gap-2 items-center">
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field} 
                            />
                            <SpeechInput 
                              onResult={(transcript) => {
                                const numericValue = transcript.replace(/[^0-9]/g, '');
                                handleVoiceInput('budget', numericValue);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <div className="flex gap-2 items-center">
                            <Input 
                              placeholder="Ubicación" 
                              {...field} 
                            />
                            <SpeechInput 
                              onResult={(transcript) => handleVoiceInput('location', transcript)}
                            />
                          </div>
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
                    {editing ? 'Actualizar Proyecto' : 'Crear Proyecto'}
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
                <Briefcase className="h-5 w-5 text-construction" />
                <span>Proyectos</span>
              </div>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                {projects.length} proyectos
              </span>
            </CardTitle>
            <CardDescription>
              Lista de proyectos existentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay proyectos registrados</p>
                <Button 
                  className="mt-4 construction-gradient text-white"
                  onClick={() => form.setFocus('name')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Crear primer proyecto
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-steel">{project.name}</h3>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleGenerateReport(project)}
                        >
                          <FileText className="h-4 w-4 text-steel" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(project)}
                        >
                          <Edit className="h-4 w-4 text-construction" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {project.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Inicio: </span>
                        {new Date(project.startDate).toLocaleDateString('es-ES')}
                      </div>
                      <div>
                        <span className="text-gray-500">Fin: </span>
                        {new Date(project.endDate).toLocaleDateString('es-ES')}
                      </div>
                      <div>
                        <span className="text-gray-500">Ubicación: </span>
                        {project.location}
                      </div>
                      <div>
                        <span className="text-gray-500">Presupuesto: </span>
                        {project.budget.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Projects;
