
import React from 'react';
import { HardHat, Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <div className="construction-gradient p-2 rounded-lg">
            <HardHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-steel">ConstrAPP</h1>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            className="pl-10 w-64"
          />
        </div>
        
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-construction text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            3
          </span>
        </Button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-construction rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">AD</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
