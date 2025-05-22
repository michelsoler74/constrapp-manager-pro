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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { db, type Worker } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

// Worker schema
const workerSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
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
      skills: '',
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const workersData = await db.getAll<Worker>('workers');
      setWorkers(workersData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
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
        skills: typeof data.skills === 'string' ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : data.skills,
        status: 'active', // Default status
        createdAt: new Date().toISOString(),
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
      await loadData();
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
      // Convert skills array to a string for the form input
      skills: Array.isArray(worker.skills) ? worker.skills.join(', ') : '',
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    form.reset();
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
      <h2 className="text-2xl font-bold mb-6 text-steel">Gestión de Trabajadores</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-construction" />
              {editing ? 'Editar Trabajador' : 'Nuevo Trabajador'}
            </CardTitle>
            <CardDescription>
              {editing 
                ? 'Actualiza la información del trabajador' 
                : 'Crea un nuevo trabajador'}
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
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
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
                      <FormLabel>Rol</FormLabel>
                      <FormControl>
                        <Input placeholder="Rol" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
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
                        <Input placeholder="Teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarifa por hora</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Tarifa por hora" {...field} />
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
                        <Input placeholder="Habilidades" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                    {editing ? 'Actualizar Trabajador' : 'Crear Trabajador'}
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
                <User className="h-5 w-5 text-construction" />
                <span>Trabajadores</span>
              </div>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                {workers.length} trabajadores
              </span>
            </CardTitle>
            <CardDescription>
              Lista de trabajadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay trabajadores registrados</p>
                <Button 
                  className="mt-4 construction-gradient text-white"
                  onClick={() => form.setFocus('name')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Crear primer trabajador
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
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
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(worker)}
                        >
                          <Edit className="h-4 w-4 text-construction" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Email: {worker.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      Teléfono: {worker.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      Tarifa por hora: {worker.hourlyRate}
                    </p>
                    {worker.skills && worker.skills.length > 0 && (
                      <div className="mt-2 text-xs">
                        <span className="text-gray-500">Habilidades: </span>
                        {worker.skills.join(', ')}
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
