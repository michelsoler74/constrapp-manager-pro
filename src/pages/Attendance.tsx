
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
  FormDescription, 
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
import { Textarea } from '@/components/ui/textarea';
import { Clock, FileText, Plus, CalendarDays, Check } from 'lucide-react';
import { toast } from 'sonner';
import { db, type Worker, type Project, type Attendance } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import SpeechInput from '@/components/SpeechInput';
import { pdfGenerator } from '@/lib/pdf-generator';

const attendanceSchema = z.object({
  workerId: z.string().min(1, 'Trabajador es requerido'),
  projectId: z.string().min(1, 'Proyecto es requerido'),
  date: z.string().min(1, 'Fecha es requerida'),
  checkIn: z.string().min(1, 'Hora de entrada es requerida'),
  checkOut: z.string().optional(),
  hoursWorked: z.coerce.number().min(0, 'Las horas deben ser positivas'),
  notes: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      workerId: '',
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      checkIn: '08:00',
      checkOut: '',
      hoursWorked: 0,
      notes: '',
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attendanceData, workersData, projectsData] = await Promise.all([
        db.getAll<Attendance>('attendance'),
        db.getAll<Worker>('workers'),
        db.getAll<Project>('projects')
      ]);
      
      setAttendance(attendanceData);
      setWorkers(workersData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AttendanceFormValues) => {
    try {
      const attendanceData: Attendance = {
        id: editing || uuidv4(),
        ...data,
        checkOut: data.checkOut || undefined,
        notes: data.notes || undefined,
        createdAt: editing ? 
          attendance.find(a => a.id === editing)?.createdAt || new Date().toISOString() : 
          new Date().toISOString(),
      };

      if (editing) {
        await db.update('attendance', attendanceData);
        toast.success('Registro actualizado correctamente');
      } else {
        await db.add('attendance', attendanceData);
        toast.success('Asistencia registrada correctamente');
      }

      form.reset();
      setEditing(null);
      await loadData();
    } catch (error) {
      console.error('Error guardando asistencia:', error);
      toast.error('Error al guardar la asistencia');
    }
  };

  const handleEdit = (record: Attendance) => {
    setEditing(record.id);
    form.reset({
      workerId: record.workerId,
      projectId: record.projectId,
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut || '',
      hoursWorked: record.hoursWorked,
      notes: record.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    form.reset();
  };

  const calculateHours = () => {
    const checkIn = form.getValues('checkIn');
    const checkOut = form.getValues('checkOut');
    
    if (checkIn && checkOut) {
      const [inHours, inMinutes] = checkIn.split(':').map(Number);
      const [outHours, outMinutes] = checkOut.split(':').map(Number);
      
      const inTime = inHours * 60 + inMinutes;
      const outTime = outHours * 60 + outMinutes;
      
      if (outTime >= inTime) {
        const diffMinutes = outTime - inTime;
        const hours = diffMinutes / 60;
        form.setValue('hoursWorked', parseFloat(hours.toFixed(2)));
      }
    }
  };

  const handleVoiceInput = (field: keyof AttendanceFormValues, transcript: string) => {
    form.setValue(field, transcript);
  };

  const handleGenerateReport = async () => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-construction" />
              {editing ? 'Editar Asistencia' : 'Registrar Asistencia'}
            </CardTitle>
            <CardDescription>
              {editing 
                ? 'Actualiza el registro de asistencia' 
                : 'Registrar entrada y salida de personal'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="workerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trabajador</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un trabajador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workers.map((worker) => (
                            <SelectItem key={worker.id} value={worker.id}>
                              {worker.name} - {worker.role}
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
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyecto</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Entrada</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              calculateHours();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checkOut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Salida</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              calculateHours();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="hoursWorked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Trabajadas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <Textarea 
                            placeholder="Observaciones, incidencias, etc." 
                            {...field} 
                            value={field.value || ''}
                          />
                          <div className="flex justify-end">
                            <SpeechInput 
                              onResult={(transcript) => handleVoiceInput('notes', transcript)}
                              placeholder="Dictar notas"
                            />
                          </div>
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
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    className="construction-gradient text-white"
                  >
                    {editing ? 'Actualizar Registro' : 'Registrar Asistencia'}
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
                  onClick={() => form.setFocus('workerId')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Registrar primera asistencia
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {attendance
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10) // Mostrar solo los últimos 10 registros
                  .map((record) => {
                    const worker = workers.find(w => w.id === record.workerId);
                    const project = projects.find(p => p.id === record.projectId);
                    
                    return (
                      <div 
                        key={record.id} 
                        className="border-l-4 border-construction pl-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-steel">{worker?.name || 'Desconocido'}</h3>
                              {record.checkOut && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Completado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{project?.name || 'Desconocido'}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="h-4 w-4 text-construction" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                          <div>
                            <span className="text-gray-500">Fecha: </span>
                            {new Date(record.date).toLocaleDateString('es-ES')}
                          </div>
                          <div>
                            <span className="text-gray-500">Entrada: </span>
                            {record.checkIn}
                          </div>
                          <div>
                            <span className="text-gray-500">Salida: </span>
                            {record.checkOut || 'Sin registrar'}
                          </div>
                        </div>
                        <div className="text-xs mt-1">
                          <span className="text-gray-500">Horas: </span>
                          <span className="font-medium">{record.hoursWorked}</span>
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
    </div>
  );
};

export default AttendancePage;
