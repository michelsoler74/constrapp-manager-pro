
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db, type Worker } from '@/lib/database';
import WorkerForm from '@/components/workers/WorkerForm';
import WorkerList from '@/components/workers/WorkerList';

const Workers: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | undefined>(undefined);

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

  const handleEdit = (worker: Worker) => {
    setEditing(worker.id);
    setEditingWorker(worker);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditingWorker(undefined);
  };

  const handleSuccess = async () => {
    setEditing(null);
    setEditingWorker(undefined);
    await loadData();
  };

  const handleCreateFirst = () => {
    // Focus on the form by scrolling to it or other UX improvement
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="lg:col-span-1">
          <WorkerForm
            editing={editing}
            editingWorker={editingWorker}
            onSuccess={handleSuccess}
            onCancel={handleCancelEdit}
          />
        </div>
        
        <WorkerList
          workers={workers}
          onEdit={handleEdit}
          onCreateFirst={handleCreateFirst}
        />
      </div>
    </div>
  );
};

export default Workers;
