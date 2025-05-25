
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { db, type Worker } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import SpeechInput from '@/components/SpeechInput';

const workerSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  role: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  hourlyRate: z.coerce.number().optional().default(0),
  skills: z.string().optional().default(''),
});

type WorkerFormValues = z.infer<typeof workerSchema>;

interface WorkerFormProps {
  editing: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  editingWorker?: Worker;
}

const WorkerForm: React.FC<WorkerFormProps> = ({ editing, onSuccess, onCancel, editingWorker }) => {
  const form = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: editingWorker?.name || '',
      role: editingWorker?.role || '',
      email: editingWorker?.email || '',
      phone: editingWorker?.phone || '',
      hourlyRate: editingWorker?.hourlyRate || 0,
      skills: editingWorker?.skills ? (Array.isArray(editingWorker.skills) ? editingWorker.skills.join(', ') : editingWorker.skills) : '',
    }
  });

  React.useEffect(() => {
    if (editingWorker) {
      form.reset({
        name: editingWorker.name,
        role: editingWorker.role,
        email: editingWorker.email,
        phone: editingWorker.phone,
        hourlyRate: editingWorker.hourlyRate,
        skills: Array.isArray(editingWorker.skills) ? editingWorker.skills.join(', ') : editingWorker.skills || '',
      });
    } else {
      form.reset({
        name: '',
        role: '',
        email: '',
        phone: '',
        hourlyRate: 0,
        skills: '',
      });
    }
  }, [editingWorker, form]);

  const onSubmit = async (data: WorkerFormValues) => {
    try {
      const workerData: Worker = {
        id: editing || uuidv4(),
        name: data.name,
        role: data.role || '',
        email: data.email || '',
        phone: data.phone || '',
        hourlyRate: data.hourlyRate || 0,
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        status: 'active',
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
      onSuccess();
    } catch (error) {
      console.error('Error guardando trabajador:', error);
      toast.error('Error al guardar el trabajador');
    }
  };

  const handleVoiceInput = (field: keyof WorkerFormValues, transcript: string) => {
    const currentValue = form.getValues(field);
    const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
    form.setValue(field, newValue);
  };

  return (
    <Card>
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
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-end">
                      <Input 
                        placeholder="Nombre" 
                        {...field} 
                        className="flex-1"
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
                  <FormLabel>Rol (opcional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-end">
                      <Input 
                        placeholder="Rol" 
                        {...field} 
                        className="flex-1"
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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-end">
                      <Input 
                        type="email" 
                        placeholder="Email" 
                        {...field} 
                        className="flex-1"
                      />
                      <SpeechInput 
                        onResult={(transcript) => handleVoiceInput('email', transcript)}
                      />
                    </div>
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
                  <FormLabel>Teléfono (opcional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-end">
                      <Input 
                        placeholder="Teléfono" 
                        {...field} 
                        className="flex-1"
                      />
                      <SpeechInput 
                        onResult={(transcript) => handleVoiceInput('phone', transcript)}
                      />
                    </div>
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
                  <FormLabel>Tarifa por hora (opcional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-end">
                      <Input 
                        type="number" 
                        placeholder="Tarifa por hora" 
                        {...field} 
                        className="flex-1"
                      />
                      <SpeechInput 
                        onResult={(transcript) => {
                          const numericValue = transcript.replace(/[^0-9.,]/g, '');
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
                  <FormLabel>Habilidades (opcional, separadas por coma)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-end">
                      <Input 
                        placeholder="Habilidades" 
                        {...field} 
                        className="flex-1"
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
            
            <div className="flex gap-2 justify-end">
              {editing && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
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
  );
};

export default WorkerForm;
