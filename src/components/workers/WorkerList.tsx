
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Plus } from 'lucide-react';
import { type Worker } from '@/lib/database';
import WorkerCard from './WorkerCard';

interface WorkerListProps {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
  onCreateFirst: () => void;
}

const WorkerList: React.FC<WorkerListProps> = ({ workers, onEdit, onCreateFirst }) => {
  return (
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
              onClick={onCreateFirst}
            >
              <Plus className="h-4 w-4 mr-2" /> Crear primer trabajador
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {workers.map((worker) => (
              <WorkerCard 
                key={worker.id} 
                worker={worker} 
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkerList;
