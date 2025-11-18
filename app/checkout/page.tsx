"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { formatRut, validateRut } from "@/lib/utils/rut";
import { ArrowLeft, Lock, User, MapPin, CreditCard, Package } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// Inicializar MercadoPago con validación
if (typeof window !== 'undefined') {
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  
  if (!publicKey) {
    console.error('❌ MERCADOPAGO_PUBLIC_KEY no está configurada');
  } else {
    console.log('✅ Inicializando MercadoPago con key:', publicKey);
    initMercadoPago(publicKey, {
      locale: 'es-CL'
    });
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { items, total, vendorId, vendorName, clearCart } = useCart();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Datos, 2: Pago
  
  // Formulario de datos
  const [formData, setFormData] = useState({
    rut: '',
    full_name: '',
    email: '',
    phone: '',
    region: '',
    city: '',
    address: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?redirect=/checkout');
        return;
      }
      
      if (items.length === 0) {
        router.push('/carrito');
        return;
      }
      
      // Cargar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUser(user);
      setProfile(profile);
      
      // Pre-llenar formulario con datos del perfil
      setFormData({
        rut: profile?.rut || '',
        full_name: profile?.full_name || '',
        email: user.email || '',
        phone: profile?.phone || '',
        region: profile?.region || '',
        city: profile?.city || '',
        address: profile?.address || '',
        notes: '',
      });
      
      setLoading(false);
    }
    
    loadUserData();
  }, []);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setFormData({ ...formData, rut: formatted });
    
    if (formatted && !validateRut(formatted)) {
      setErrors({ ...errors, rut: 'RUT inválido' });
    } else {
      const { rut, ...rest } = errors;
      setErrors(rest);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.rut) newErrors.rut = 'RUT es requerido';
    else if (!validateRut(formData.rut)) newErrors.rut = 'RUT inválido';
    
    if (!formData.full_name) newErrors.full_name = 'Nombre completo es requerido';
    if (!formData.email) newErrors.email = 'Email es requerido';
    if (!formData.phone) newErrors.phone = 'Teléfono es requerido';
    if (!formData.region) newErrors.region = 'Región es requerida';
    if (!formData.city) newErrors.city = 'Ciudad es requerida';
    if (!formData.address) newErrors.address = 'Dirección es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

 const onSubmit = async ({ selectedPaymentMethod, formData: paymentFormData }: any) => {
  try {
    console.log('=== PAYMENT DATA RECEIVED ===');
    console.log('Selected payment method:', selectedPaymentMethod);
    console.log('Form data:', paymentFormData);
    console.log('============================');

    // Validar que tengamos los datos necesarios
    if (!paymentFormData) {
      throw new Error('No se recibieron datos de pago');
    }

    // Calcular subtotal y comisión (15% de REDY)
const subtotal = total;
const commissionTotal = Math.round(total * 0.15);

// Crear orden en la base de datos primero
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    buyer_id: user.id,
    vendor_id: vendorId,
    subtotal: subtotal,
    commission_total: commissionTotal,
    total: total,
    status: 'pending',
    shipping_address: formData.address,
    shipping_city: formData.city,
    shipping_region: formData.region,
    shipping_phone: formData.phone,
    buyer_rut: formData.rut,
    buyer_notes: formData.notes,
  })
  .select()
  .single();

    if (orderError) throw orderError;

    console.log('✅ Order created:', order.id);

    // Crear items de la orden con comisión y monto del vendedor
const orderItems = items.map(item => {
  const commissionAmount = Math.round(item.price * 0.15); // 15% comisión
  const vendorAmount = item.price - commissionAmount; // 85% para vendedor
  
  return {
    order_id: order.id,
    product_id: item.product_id,
    vendor_id: vendorId,
    price: item.price,
    commission_amount: commissionAmount,
    vendor_amount: vendorAmount,
  };
});

const { error: itemsError } = await supabase
  .from('order_items')
  .insert(orderItems);

if (itemsError) throw itemsError;
    console.log('✅ Order items created');

    // Preparar datos del pago
    const paymentPayload = {
      orderId: order.id,
      paymentData: {
        ...paymentFormData,
        email: formData.email,
        rut: formData.rut.replace(/\./g, '').replace(/-/g, ''),
      },
    };

    console.log('📤 Sending to API:', paymentPayload);

    // Procesar pago con MercadoPago
    const response = await fetch('/api/mercadopago/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload),
    });

    const result = await response.json();
    console.log('📥 API Response:', result);

    if (result.success) {
      console.log('✅ Payment successful!');

      // Marcar productos como no disponibles
      await Promise.all(
        items.map(item =>
          supabase
            .from('products')
            .update({ available: false })
            .eq('id', item.product_id)
        )
      );

      // Limpiar carrito
      clearCart();

      // Redirigir a página de éxito
      router.push(`/orden/${order.id}/confirmacion`);
    } else {
      throw new Error(result.error || 'Error al procesar el pago');
    }
  } catch (error: any) {
    console.error('❌ Submit error:', error);
    alert('Error al procesar la compra: ' + error.message);
  }
};

  const onError = async (error: any) => {
  console.error('Payment error details:', error);
  
  if (error.message) {
    alert(`Error: ${error.message}`);
  } else {
    alert('Error al procesar el pago. Por favor intenta de nuevo.');
  }
};

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando checkout...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <Link
            href="/carrito"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al carrito
          </Link>

          <h1 className="text-3xl font-bold mb-8">Finalizar compra</h1>

          {/* Progress steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="font-medium">Tus datos</span>
              </div>
              
              <div className="w-12 h-px bg-gray-300"></div>
              
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="font-medium">Pago</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información del comprador
                  </h2>

                  <div className="space-y-4">
                    {/* RUT */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        RUT *
                      </label>
                      <input
                        type="text"
                        value={formData.rut}
                        onChange={handleRutChange}
                        placeholder="12.345.678-9"
                        className={`w-full px-4 py-3 border ${errors.rut ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-blue-500`}
                      />
                      {errors.rut && (
                        <p className="text-red-600 text-sm mt-1">{errors.rut}</p>
                      )}
                    </div>

                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Juan Pérez"
                        className={`w-full px-4 py-3 border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-blue-500`}
                      />
                      {errors.full_name && (
                        <p className="text-red-600 text-sm mt-1">{errors.full_name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="juan@ejemplo.cl"
                          className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-blue-500`}
                        />
                        {errors.email && (
                          <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>

                      {/* Teléfono */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+56 9 1234 5678"
                          className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-blue-500`}
                        />
                        {errors.phone && (
                          <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mt-6 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Dirección de entrega
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Región */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Región *
                        </label>
                        <select
                          value={formData.region}
                          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                          className={`w-full px-4 py-3 border ${errors.region ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-blue-500`}
                        >
                          <option value="">Selecciona región</option>
                          <option value="Región Metropolitana">Región Metropolitana</option>
                          <option value="Valparaíso">Valparaíso</option>
                          <option value="Biobío">Biobío</option>
                          <option value="Araucanía">Araucanía</option>
                          <option value="Los Lagos">Los Lagos</option>
                          {/* Agregar más regiones */}
                        </select>
                        {errors.region && (
                          <p className="text-red-600 text-sm mt-1">{errors.region}</p>
                        )}
                      </div>

                      {/* Ciudad */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ciudad *
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Santiago"
                          className={`w-full px-4 py-3 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-blue-500`}
                        />
                        {errors.city && (
                          <p className="text-red-600 text-sm mt-1">{errors.city}</p>
                        )}
                      </div>
                    </div>

                    {/* Dirección */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Dirección completa *
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Av. Providencia 1234, Depto 501"
                        className={`w-full px-4 py-3 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-blue-500`}
                      />
                      {errors.address && (
                        <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                      )}
                    </div>

                    {/* Notas */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notas adicionales (opcional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        placeholder="Referencias de tu ubicación, instrucciones especiales, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleContinueToPayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition-colors mt-6"
                  >
                    Continuar al pago
                  </button>
                </div>
              )}

              {step === 2 && (
  <div className="bg-white rounded-2xl border border-gray-200 p-6">
    <button
      onClick={() => setStep(1)}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      Editar información
    </button>

    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
      <CreditCard className="w-5 h-5" />
      Método de pago
    </h2>

    <Payment
      initialization={{
        amount: total,
      }}
      customization={{
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          prepaidCard: "all", // IMPORTANTE: esto faltaba
          mercadoPago: "all",
        },
      }}
      onSubmit={onSubmit}
      onReady={() => {
        console.log('Payment Brick ready');
      }}
      onError={onError}
    />
  </div>
)}
            </div>

            {/* Resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Resumen de compra
                </h2>

                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm line-clamp-2">{item.name}</p>
                        <p className="text-sm text-gray-600">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vendedor</span>
                    <span className="font-semibold">{vendorName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-semibold">A coordinar</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-6">
                  <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                    <Lock className="w-4 h-4" />
                    <span className="font-semibold">Compra protegida</span>
                  </div>
                  <p className="text-xs text-green-600">
                    Tu dinero está seguro hasta que confirmes que recibiste el producto
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}