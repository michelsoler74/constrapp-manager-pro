import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Users, Plus, Edit, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { db, type Worker, type Attendance } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import SpeechInput from '@/components/SpeechInput';
import { pdfGenerator } from '@/lib/pdf-generator';

const workerSchema = z.object({
  name: z.string().min(1, 'Nombre del trabajador es requerido'),
  role: z.string().min(1, 'Rol es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono es requerido'),
  hourlyRate: z.coerce.number().positive('La tarifa debe ser positiva'),
  skills: z.string().transform(val => typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : []),
});

type WorkerFormValues = z.infer<typeof workerSchema>;

const Workers: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  const form = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: '',
      role: '',
      email: '',
      phone: '',
      hourlyRate: 0,
      skills: [],
    }
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const workersData = await db.getAll<Worker>('workers');
      setWorkers(workersData);
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
      toast.error('Error al cargar los trabajadores');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: WorkerFormValues) => {
    try {
      const workerData: Worker = {
        id: editing || uuidv4(),
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        hourlyRate: data.hourlyRate,
        // Ensure skills is always properly processed as an array
        skills: Array.isArray(data.skills) ? data.skills : [],
        status: editing ? 
          workers.find(w => w.id === editing)?.status || 'active' : 
          'active',
        createdAt: editing ? 
          workers.find(w => w.id === editing)?.createdAt || new Date().toISOString() : 
          new Date().toISOString(),
      };

      if (editing) {
        await db.update('workers', workerData);
        toast.success('Trabajador actualizado correctamente');
      } else {
        await db.add('workers', workerData);
        toast.success('Trabajador creado correctamente');
      }

      form.reset();
      setEditing(null);
      await loadWorkers();
    } catch (error) {
      console.error('Error guardando trabajador:', error);
      toast.error('Error al guardar el trabajador');
    }
  };

  const handleEdit = (worker: Worker) => {
    setEditing(worker.id);
    form.reset({
      name: worker.name,
      role: worker.role,
      email: worker.email,
      phone: worker.phone,
      hourlyRate: worker.hourlyRate,
      // Fix: Convert skills array to a string for form input
      skills: Array.isArray(worker.skills) ? worker.skills.join(', ') : '',
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    form.reset();
  };

  const handleVoiceInput = (field: keyof WorkerFormValues, transcript: string) => {
    form.setValue(field, transcript);
  };

  const handleGenerateReport = async (worker: Worker) => {
    try {
      const attendance = await db.getByIndex<Attendance>('attendance', 'workerId', worker.id);
      const projectIds = Array.from(new Set(attendance.map(a => a.projectId)));
      const projects = await Promise.all(
        projectIds.map(id => db.getById('projects', id))
      );
      
      const pdfBlob = pdfGenerator.generateWorkerReport(worker, attendance, projects.filter(Boolean) as any[]);
      
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
      <h2 className="text-2xl font-bold mb-6 text-steel">Gestión de Personal</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-construction" />
              {editing ? 'Editar Trabajador' : 'Nuevo Trabajador'}
            </CardTitle>
            <CardDescription>
              {editing 
                ? 'Actualiza la información del trabajador' 
                : 'Completa el formulario para registrar un nuevo trabajador'}
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
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <Input 
                            placeholder="Nombre del trabajador" 
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol / Puesto</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <Input 
                            placeholder="Albañil, Electricista, etc." 
                            {...field} 
                          />
                          <SpeechInput 
                            onResult={(transcript) => handleVoiceInput('role', transcript)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="email@ejemplo.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <div className="flex gap-2 items-center">
                            <Input 
                              placeholder="+34 XXX XXX XXX" 
                              {...field} 
                            />
                            <SpeechInput 
                              onResult={(transcript) => {
                                const phoneNumber = transcript.replace(/[^0-9+]/g, '');
                                handleVoiceInput('phone', phoneNumber);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarifa por Hora (€)</FormLabel>
                        <FormControl>
                          <div className="flex gap-2 items-center">
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              step="0.01"
                              {...field} 
                            />
                            <SpeechInput 
                              onResult={(transcript) => {
                                const numericValue = transcript.replace(/[^0-9.]/g, '');
                                handleVoiceInput('hourlyRate', numericValue);
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
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Habilidades (separadas por coma)</FormLabel>
                        <FormControl>
                          <div className="flex gap-2 items-center">
                            <Input 
                              placeholder="Carpintería, Soldadura, etc." 
                              {...field}
                              value={typeof field.value === 'string' ? field.value : field.value.join(', ')}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                            <SpeechInput 
                              onResult={(transcript) => handleVoiceInput('skills', transcript)}
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
                    {editing ? 'Actualizar Trabajador' : 'Registrar Trabajador'}
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
                <Users className="h-5 w-5 text-construction" />
                <span>Personal</span>
              </div>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                {workers.length} trabajadores
              </span>
            </CardTitle>
            <CardDescription>
              Lista de trabajadores registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay trabajadores registrados</p>
                <Button 
                  className="mt-4 construction-gradient text-white"
                  onClick={() => form.setFocus('name')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Registrar primer trabajador
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workers.map((worker) => (
                  <div 
                    key={worker.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-steel">{worker.name}</h3>
                        <p className="text-sm text-construction">{worker.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleGenerateReport(worker)}
                        >
                          <FileText className="h-4 w-4 text-steel" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(worker)}
                        >
                          <Edit className="h-4 w-4 text-construction" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-500">Email: </span>
                        {worker.email}
                      </div>
                      <div>
                        <span className="text-gray-500">Teléfono: </span>
                        {worker.phone}
                      </div>
                      <div>
                        <span className="text-gray-500">Tarifa: </span>
                        {worker.hourlyRate.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR'
                        })}/hora
                      </div>
                      <div>
                        <span className="text-gray-500">Estado: </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          worker.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {worker.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    {worker.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {worker.skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="bg-gray-100 text-xs px-2 py-0.5 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
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

export default Workers;
