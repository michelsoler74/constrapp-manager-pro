
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { type Worker } from '@/lib/database';

interface WorkerCardProps {
  worker: Worker;
  onEdit: (worker: Worker) => void;
}

const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onEdit }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-steel">{worker.name}</h3>
          <p className="text-sm text-construction">{worker.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onEdit(worker)}
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
          {Array.isArray(worker.skills) ? worker.skills.join(', ') : worker.skills}
        </div>
      )}
    </div>
  );
};

export default WorkerCard;
