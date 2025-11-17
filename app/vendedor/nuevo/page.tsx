"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ui/ImageUpload";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Info,
  Camera,
  AlertCircle
} from "lucide-react";

// Especificaciones por categoría
const categorySpecs: Record<string, { label: string; type: string; options?: string[] }[]> = {
  running: [
    { label: "Talla (US)", type: "select", options: ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"] },
    { label: "Género", type: "select", options: ["Hombre", "Mujer", "Unisex"] },
    { label: "Tipo de pisada", type: "select", options: ["Neutra", "Pronadora", "Supinadora"] },
  ],
  ciclismo: [
    { label: "Talla de cuadro", type: "select", options: ["XS (48cm)", "S (50cm)", "M (52cm)", "L (54cm)", "XL (56cm)", "XXL (58cm)"] },
    { label: "Material", type: "select", options: ["Aluminio", "Carbono", "Acero", "Titanio"] },
    { label: "Tipo", type: "select", options: ["Ruta", "MTB", "Gravel", "Urbana", "Triatlón"] },
  ],
  natacion: [
    { label: "Talla", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
    { label: "Grosor (mm)", type: "select", options: ["2mm", "3mm", "4mm", "5mm"] },
    { label: "Tipo de agua", type: "select", options: ["Aguas abiertas", "Piscina", "Ambas"] },
  ],
  triatlon: [
    { label: "Talla", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
    { label: "Tipo de producto", type: "select", options: ["Bicicleta", "Wetsuit", "Ropa", "Accesorios"] },
  ],
  fitness: [
    { label: "Peso (kg)", type: "text" },
    { label: "Condición", type: "select", options: ["Como nuevo", "Muy bueno", "Bueno", "Aceptable"] },
  ],
  tecnologia: [
    { label: "Marca", type: "text" },
    { label: "Modelo", type: "text" },
    { label: "Año", type: "text" },
  ],
};

export default function NuevoProducto() {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    condition: "excelente",
    price: "",
    description: "",
    images: [] as string[],
    specs: {} as Record<string, string>,
  });

  // Cargar categorías
  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      setCategories(data || []);
    }
    loadCategories();
  }, []);

  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const categorySpecsFields = selectedCategory ? categorySpecs[selectedCategory.slug] || [] : [];

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("products")
        .insert({
          vendor_id: user.id,
          category_id: formData.category_id,
          name: formData.name,
          description: formData.description,
          price: parseInt(formData.price),
          condition: formData.condition,
          images: formData.images,
          approval_status: "pending",
        });

      if (error) throw error;

      router.push("/vendedor");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.category_id && formData.condition;
      case 2:
        return categorySpecsFields.every(field => formData.specs[field.label]);
      case 3:
        return formData.images.length >= 3;
      case 4:
        return formData.price && formData.description;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Publicar nuevo producto
          </h1>
          <p className="text-gray-600">
            Completa los pasos para publicar tu producto
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s < step
                      ? "bg-green-500 text-white"
                      : s === step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 5 && (
                  <div
                    className={`h-1 w-12 ${
                      s < step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            {step === 1 && "Información básica"}
            {step === 2 && "Especificaciones"}
            {step === 3 && "Fotografías"}
            {step === 4 && "Precio y descripción"}
            {step === 5 && "Revisar y publicar"}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {/* PASO 1: Información básica */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Zapatillas Nike Vaporfly Next% 2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Incluye marca y modelo para más visibilidad
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Condición del producto *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {["excelente", "bueno", "aceptable"].map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, condition: cond })
                      }
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.condition === cond
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-semibold capitalize">{cond}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {cond === "excelente" && "Como nuevo"}
                        {cond === "bueno" && "Buen estado"}
                        {cond === "aceptable" && "Uso visible"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Especificaciones */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">
                    Completa las especificaciones de tu producto
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Estos datos ayudan a los compradores a encontrar exactamente lo que buscan
                  </p>
                </div>
              </div>

              {categorySpecsFields.length > 0 ? (
                categorySpecsFields.map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {field.label} *
                    </label>
                    {field.type === "select" && field.options ? (
                      <select
                        value={formData.specs[field.label] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specs: {
                              ...formData.specs,
                              [field.label]: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Selecciona una opción</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.specs[field.label] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specs: {
                              ...formData.specs,
                              [field.label]: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No se requieren especificaciones adicionales para esta categoría
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Fotografías */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-4">
                  <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-semibold mb-2">
                      📸 Tips para fotos de calidad:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✓ Muestra el producto completo y sus detalles importantes</li>
                      <li>✓ Usa buena iluminación (luz natural es ideal)</li>
                      <li>✓ Fondo limpio y neutro</li>
                      <li>✓ Muestra cualquier defecto o señal de uso</li>
                      <li>✓ Mínimo 3 fotos, máximo 5</li>
                    </ul>
                  </div>
                </div>
              </div>

              <ImageUpload
                value={formData.images}
                onChange={(images) =>
                  setFormData({ ...formData, images })
                }
                maxImages={5}
              />

              {formData.images.length < 3 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm text-orange-700">
                    Necesitas al menos 3 fotos para publicar tu producto
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PASO 4: Precio y descripción */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Precio (CLP) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="50000"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  REDY cobrará una comisión del 15% sobre el precio de venta
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción detallada *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={6}
                  placeholder="Describe el estado del producto, incluye detalles importantes como:&#10;- Cuánto tiempo lo has usado&#10;- Si tiene algún detalle o defecto&#10;- Por qué lo vendes&#10;- Accesorios incluidos"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Mínimo 50 caracteres. Sé honesto y detallado.
                </p>
              </div>
            </div>
          )}

          {/* PASO 5: Preview */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mb-6">
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-900 font-medium">
                  ¡Todo listo! Revisa tu producto antes de publicar
                </p>
              </div>

              {/* Preview */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={formData.images[0]}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{formData.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 capitalize">
                    {formData.condition} · {selectedCategory?.name}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mb-4">
                    ${parseInt(formData.price).toLocaleString("es-CL")}
                  </p>
                  <p className="text-gray-700 text-sm whitespace-pre-line">
                    {formData.description}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-900">
                  <strong>Importante:</strong> Tu producto será revisado por nuestro equipo antes de publicarse. Te notificaremos cuando esté aprobado (generalmente 24-48 horas).
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              Anterior
            </button>

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                {loading ? "Publicando..." : "Publicar producto"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}