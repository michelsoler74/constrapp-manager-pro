import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import SpeechInput from "@/components/SpeechInput";

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

const MaterialsForm: React.FC<MaterialsFormProps> = ({
  materials,
  onMaterialsChange,
}) => {
  const [newMaterial, setNewMaterial] = useState<Omit<Material, "id">>({
    name: "",
    quantity: 0,
    unit: "",
    cost: 0,
    supplier: "",
  });

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null
  );

  const addMaterial = () => {
    if (!newMaterial.name) {
      toast.error("Por favor, escribe el nombre del material");
      return;
    }
    const material: Material = {
      id: Date.now().toString(),
      name: newMaterial.name,
      quantity: newMaterial.quantity || 0,
      unit: "", // Eliminado del formulario, pero mantenido por compatibilidad
      cost: newMaterial.cost || undefined,
      supplier: newMaterial.supplier || undefined,
    };
    onMaterialsChange([...materials, material]);
    setNewMaterial({ name: "", quantity: 0, unit: "", cost: 0, supplier: "" });
    toast.success("Material añadido correctamente");
  };

  const removeMaterial = (id: string) => {
    onMaterialsChange(materials.filter((m) => m.id !== id));
    toast.success("Material eliminado");
  };

  const handleVoiceInput = (
    field: keyof Omit<Material, "id">,
    transcript: string
  ) => {
    if (field === "quantity" || field === "cost") {
      const numericValue = parseFloat(
        transcript.replace(/[^0-9.,]/g, "").replace(",", ".")
      );
      if (!isNaN(numericValue)) {
        setNewMaterial((prev) => ({ ...prev, [field]: numericValue }));
      }
    } else {
      setNewMaterial((prev) => ({ ...prev, [field]: transcript }));
    }
  };

  const handleEditMaterial = (material: Material) => {
    setNewMaterial({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      cost: material.cost || 0,
      supplier: material.supplier || "",
    });
    setEditingMaterialId(material.id);
  };

  const handleSaveEdit = () => {
    if (!newMaterial.name || !newMaterial.unit || newMaterial.quantity <= 0) {
      toast.error("Por favor, completa los campos obligatorios del material");
      return;
    }
    onMaterialsChange(
      materials.map((mat) =>
        mat.id === editingMaterialId ? { ...mat, ...newMaterial } : mat
      )
    );
    setNewMaterial({ name: "", quantity: 0, unit: "", cost: 0, supplier: "" });
    setEditingMaterialId(null);
    toast.success("Material editado correctamente");
  };

  const handleCancelEdit = () => {
    setNewMaterial({ name: "", quantity: 0, unit: "", cost: 0, supplier: "" });
    setEditingMaterialId(null);
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
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-lg bg-gray-50">
          <div className="md:col-span-3">
            <label className="text-sm font-medium">Nombre del Material *</label>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Cemento, Ladrillos..."
                value={newMaterial.name}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, name: e.target.value }))
                }
                className="text-base py-2 px-3 w-full"
              />
              <SpeechInput
                onResult={(transcript) => handleVoiceInput("name", transcript)}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Cantidad *</label>
            <div className="flex gap-2 items-center">
              <div className="flex items-center w-full">
                <Input
                  type="number"
                  placeholder="100"
                  value={newMaterial.quantity || ""}
                  onChange={(e) =>
                    setNewMaterial((prev) => ({
                      ...prev,
                      quantity: Number(e.target.value),
                    }))
                  }
                  className="text-base py-2 px-3 min-w-[80px] w-auto"
                  style={{ width: "100px" }}
                />
                <SpeechInput
                  onResult={(transcript) =>
                    handleVoiceInput("quantity", transcript)
                  }
                />
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="text-sm font-medium">Proveedor</label>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Nombre del proveedor"
                value={newMaterial.supplier || ""}
                onChange={(e) =>
                  setNewMaterial((prev) => ({
                    ...prev,
                    supplier: e.target.value,
                  }))
                }
                className="text-base py-2 px-3 w-full"
              />
              <SpeechInput
                onResult={(transcript) =>
                  handleVoiceInput("supplier", transcript)
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Costo</label>
            <div className="flex gap-2 items-center">
              <div className="flex items-center w-full">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newMaterial.cost || ""}
                  onChange={(e) =>
                    setNewMaterial((prev) => ({
                      ...prev,
                      cost: Number(e.target.value),
                    }))
                  }
                  className="text-base py-2 px-3 min-w-[100px] w-auto rounded-r-none"
                  style={{ width: "120px" }}
                />
                <span className="bg-gray-100 border border-l-0 border-gray-300 px-2 py-2 rounded-r text-gray-600 text-base">
                  €
                </span>
                <SpeechInput
                  onResult={(transcript) =>
                    handleVoiceInput("cost", transcript)
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex items-end md:col-span-7">
            <Button
              type="button"
              onClick={editingMaterialId ? handleSaveEdit : addMaterial}
              className="construction-gradient text-white px-4 py-2 rounded text-sm w-auto"
              style={{ minWidth: "120px" }}
            >
              {editingMaterialId ? (
                <>Guardar cambios</>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </>
              )}
            </Button>
          </div>
        </div>

        {editingMaterialId && (
          <Button
            onClick={handleCancelEdit}
            variant="outline"
            className="w-full mt-2"
          >
            Cancelar edición
          </Button>
        )}

        {/* Materials list */}
        {materials.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Materiales añadidos:</h4>
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-white"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
                  <div>
                    <span
                      className="font-medium cursor-pointer underline"
                      onClick={() => handleEditMaterial(material)}
                    >
                      {material.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {material.quantity} {material.unit}
                  </div>
                  <div className="text-sm text-gray-600">
                    {material.cost
                      ? `€${material.cost.toFixed(2)}`
                      : "Sin costo"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {material.supplier || "Sin proveedor"}
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
