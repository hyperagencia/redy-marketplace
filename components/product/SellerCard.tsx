import { Check, MapPin, Star } from "lucide-react";

interface SellerCardProps {
  vendor: any;
  productsCount: number;
}

export default function SellerCard({ vendor, productsCount }: SellerCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-600 mb-4">VENDEDOR</h2>
      
      <div className="flex items-center gap-4 mb-4">
        {vendor?.avatar_url ? (
          <img
            src={vendor.avatar_url}
            alt={vendor.full_name}
            className="w-16 h-16 rounded-full border-2 border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {vendor?.full_name?.[0] || "V"}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{vendor?.full_name || "Vendedor"}</h3>
            {vendor?.verified && (
              <div className="bg-blue-600 rounded-full p-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {vendor?.products_count || 0} productos en venta
          </div>
        </div>
      </div>

      {vendor?.city && vendor?.region && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4" />
          <span>{vendor.city}, {vendor.region}</span>
        </div>
      )}

      {vendor?.verified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
            <Check className="w-4 h-4" />
            <span>Vendedor verificado por REDY</span>
          </div>
        </div>
      )}

      <button className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-900 py-3 rounded-xl font-semibold transition-all">
        Ver perfil del vendedor
      </button>
    </div>
  );
}