
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import { db } from '@/lib/database';
import { toast } from 'sonner';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await db.init();
      console.log('Database initialized successfully');
      toast.success('ConstrAPP inicializado correctamente');
    } catch (error) {
      console.error('Error initializing app:', error);
      toast.error('Error al inicializar la aplicación');
    } finally {
      setLoading(false);
    }
  };

  const getSectionTitle = (section: string): string => {
    const titles: Record<string, string> = {
      dashboard: 'Panel Principal',
      projects: 'Gestión de Proyectos',
      workers: 'Gestión de Personal',
      tasks: 'Gestión de Tareas',
      attendance: 'Control de Asistencia',
      reports: 'Reportes y Análisis',
      settings: 'Configuración'
    };
    return titles[section] || 'ConstrAPP';
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Gestión de Proyectos</h2>
            <p>Sección en desarrollo...</p>
          </div>
        );
      case 'workers':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Gestión de Personal</h2>
            <p>Sección en desarrollo...</p>
          </div>
        );
      case 'tasks':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Gestión de Tareas</h2>
            <p>Sección en desarrollo...</p>
          </div>
        );
      case 'attendance':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Control de Asistencia</h2>
            <p>Sección en desarrollo...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Reportes y Análisis</h2>
            <p>Sección en desarrollo...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Configuración</h2>
            <p>Sección en desarrollo...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="construction-gradient p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h1 className="text-2xl font-bold text-steel mb-2">ConstrAPP</h1>
          <p className="text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        <div className="flex-1 lg:ml-0">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            title={getSectionTitle(activeSection)}
          />
          
          <main className="p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
