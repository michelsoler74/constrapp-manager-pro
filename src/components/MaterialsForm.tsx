
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import SpeechInput from '@/components/SpeechInput';

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  supplier?: string;
}

interface MaterialsFormProps {
  materials: Material[];
  onMaterialsChange: (materials: Material[]) => void;
}

const MaterialsForm: React.FC<MaterialsFormProps> = ({ materials, onMaterialsChange }) => {
  const [newMaterial, setNewMaterial] = useState<Omit<Material, 'id'>>({
    name: '',
    quantity: 0,
    unit: '',
    cost: 0,
    supplier: '',
  });

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.unit || newMaterial.quantity <= 0) {
      toast.error('Por favor, completa los campos obligatorios del material');
      return;
    }

    const material: Material = {
      ...newMaterial,
      id: Date.now().toString(),
    };

    onMaterialsChange([...materials, material]);
    setNewMaterial({
      name: '',
      quantity: 0,
      unit: '',
      cost: 0,
      supplier: '',
    });
    toast.success('Material añadido correctamente');
  };

  const removeMaterial = (id: string) => {
    onMaterialsChange(materials.filter(m => m.id !== id));
    toast.success('Material eliminado');
  };

  const handleVoiceInput = (field: keyof Omit<Material, 'id'>, transcript: string) => {
    if (field === 'quantity' || field === 'cost') {
      const numericValue = parseFloat(transcript.replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (!isNaN(numericValue)) {
        setNewMaterial(prev => ({ ...prev, [field]: numericValue }));
      }
    } else {
      setNewMaterial(prev => ({ ...prev, [field]: transcript }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-construction" />
          Materiales (Opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new material form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
          <div>
            <label className="text-sm font-medium">Nombre del Material *</label>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Cemento, Ladrillos..."
                value={newMaterial.name}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
              />
              <SpeechInput 
                onResult={(transcript) => handleVoiceInput('name', transcript)}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Cantidad *</label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="100"
                value={newMaterial.quantity || ''}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              />
              <SpeechInput 
                onResult={(transcript) => handleVoiceInput('quantity', transcript)}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Unidad *</label>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="kg, m³, unidades..."
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, unit: e.target.value }))}
              />
              <SpeechInput 
                onResult={(transcript) => handleVoiceInput('unit', transcript)}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Costo (€)</label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="0.00"
                value={newMaterial.cost || ''}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, cost: Number(e.target.value) }))}
              />
              <SpeechInput 
                onResult={(transcript) => handleVoiceInput('cost', transcript)}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Proveedor</label>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Nombre del proveedor"
                value={newMaterial.supplier || ''}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, supplier: e.target.value }))}
              />
              <SpeechInput 
                onResult={(transcript) => handleVoiceInput('supplier', transcript)}
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={addMaterial}
              className="construction-gradient text-white w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir
            </Button>
          </div>
        </div>

        {/* Materials list */}
        {materials.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Materiales añadidos:</h4>
            {materials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
                  <div>
                    <span className="font-medium">{material.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {material.quantity} {material.unit}
                  </div>
                  <div className="text-sm text-gray-600">
                    {material.cost ? `€${material.cost.toFixed(2)}` : 'Sin costo'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {material.supplier || 'Sin proveedor'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMaterial(material.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialsForm;
