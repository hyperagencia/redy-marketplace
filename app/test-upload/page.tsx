"use client";

import { useState } from "react";
import ImageUpload from "@/components/ui/ImageUpload";

export default function TestUploadPage() {
  const [images, setImages] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold mb-6">
            Prueba de Upload - Cloudinary
          </h1>
          
          <ImageUpload
            value={images}
            onChange={setImages}
            maxImages={5}
          />

          {/* Mostrar URLs */}
          {images.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold mb-2">URLs generadas:</p>
              <div className="space-y-2">
                {images.map((url, index) => (
                  <p key={index} className="text-xs text-gray-600 break-all">
                    {index + 1}. {url}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}