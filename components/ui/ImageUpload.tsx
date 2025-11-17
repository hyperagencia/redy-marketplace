"use client";

import { ImagePlus, X, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxImages?: number;
}

declare global {
  interface Window {
    cloudinary: any;
  }
}

export default function ImageUpload({ 
  value = [], 
  onChange, 
  maxImages = 5 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [widget, setWidget] = useState<any>(null);

  useEffect(() => {
    // Cargar el script de Cloudinary
    if (!document.getElementById('cloudinary-upload-widget')) {
      const script = document.createElement('script');
      script.id = 'cloudinary-upload-widget';
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const openWidget = () => {
    if (!window.cloudinary) {
      alert('Cloudinary no está cargado. Recarga la página.');
      return;
    }

    const myWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: 'redy_products',
        multiple: true,
        maxFiles: maxImages - value.length,
        folder: 'redy/products',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 10000000,
        sources: ['local', 'camera'],
        showUploadMoreButton: true,
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#E5E7EB",
            tabIcon: "#2563EB",
            menuIcons: "#6B7280",
            textDark: "#111827",
            textLight: "#FFFFFF",
            link: "#2563EB",
            action: "#2563EB",
            inactiveTabIcon: "#9CA3AF",
            error: "#EF4444",
            inProgress: "#2563EB",
            complete: "#10B981",
            sourceBg: "#F9FAFB"
          }
        }
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const newUrl = result.info.secure_url;
          if (!value.includes(newUrl)) {
            onChange([...value, newUrl]);
          }
        }
        
        if (result && result.event === "queues-start") {
          setIsUploading(true);
        }
        
        if (result && result.event === "queues-end") {
          setIsUploading(false);
        }
        
        if (result && result.event === "close") {
          setIsUploading(false);
        }
      }
    );

    myWidget.open();
    setWidget(myWidget);
  };

  const onRemove = (url: string) => {
    onChange(value.filter((current) => current !== url));
  };

  return (
    <div>
      {/* Grid de imágenes subidas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {value.map((url, index) => (
          <div key={url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group">
            <Image
              src={url}
              alt={`Producto ${index + 1}`}
              fill
              className="object-cover"
            />
            {/* Badge de orden */}
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
              {index + 1}
            </div>
            {/* Botón para eliminar */}
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Checkmark */}
            <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 rounded-full">
              <Check className="w-3 h-3" />
            </div>
          </div>
        ))}

        {/* Indicador de carga */}
        {isUploading && (
          <div className="aspect-square rounded-xl border-2 border-dashed border-blue-500 flex flex-col items-center justify-center gap-2 bg-blue-50">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-600 font-medium">
              Subiendo...
            </span>
          </div>
        )}

        {/* Botón de upload */}
        {value.length < maxImages && (
          <button
            type="button"
            onClick={openWidget}
            disabled={isUploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 flex flex-col items-center justify-center gap-2 transition-colors bg-gray-50 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImagePlus className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">
              {isUploading ? 'Subiendo...' : 'Agregar fotos'}
            </span>
            <span className="text-xs text-gray-400">
              {value.length}/{maxImages}
            </span>
          </button>
        )}
      </div>

      {/* Helper text */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          📸 Sube hasta {maxImages} fotos. Formatos: JPG, PNG, WEBP. Máximo 10MB por imagen.
        </p>
        <p className="text-xs text-gray-500">
          💡 Tip: Haz click en "Select Files" y selecciona varias fotos. Cada una aparecerá en el widget.
        </p>
        {value.length > 0 && value.length < 3 && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
            <span className="font-semibold">⚠️</span>
            <span>Necesitas al menos 3 fotos (tienes {value.length})</span>
          </div>
        )}
        {value.length >= 3 && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <Check className="w-4 h-4" />
            <span>¡Perfecto! Ya tienes {value.length} foto{value.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}