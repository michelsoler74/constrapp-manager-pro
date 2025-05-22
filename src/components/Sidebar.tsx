
import React from 'react';
import { 
  Home, 
  Briefcase, 
  Users, 
  CheckSquare, 
  Clock, 
  FileText, 
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'projects', label: 'Proyectos', icon: Briefcase },
  { id: 'workers', label: 'Personal', icon: Users },
  { id: 'tasks', label: 'Tareas', icon: CheckSquare },
  { id: 'attendance', label: 'Asistencia', icon: Clock },
  { id: 'reports', label: 'Reportes', icon: FileText },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeSection, onSectionChange }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="construction-gradient p-2 rounded-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-steel">Menú Principal</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onSectionChange(item.id);
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                        isActive 
                          ? "bg-construction text-white" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="glass-effect rounded-lg p-3 text-center">
              <p className="text-sm text-gray-600">Versión 1.0.0</p>
              <p className="text-xs text-gray-500">ConstrAPP Pro</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
