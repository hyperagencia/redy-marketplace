import { createClient } from './server'

// =============================================
// PRODUCTOS
// =============================================

export async function getProducts(filters?: {
  status?: string
  category?: string
  vendor?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('products')
    .select('*')
  
  if (filters?.status) {
    query = query.eq('approval_status', filters.status)
  }
  
  if (filters?.category) {
    query = query.eq('category_id', filters.category)
  }
  
  if (filters?.vendor) {
    query = query.eq('vendor_id', filters.vendor)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  
  return data || []
}

export async function getProductById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching product:', error)
    return null
  }
  
  return data
}

// =============================================
// VENDEDORES
// =============================================

export async function getVendors(filters?: {
  verified?: boolean
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'seller')
  
  if (filters?.verified !== undefined) {
    query = query.eq('verified', filters.verified)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching vendors:', error)
    return []
  }
  
  return data || []
}

export async function getVendorById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'seller')
    .single()
  
  if (error) {
    console.error('Error fetching vendor:', error)
    return null
  }
  
  return data
}

// =============================================
// CATEGORÍAS
// =============================================

export async function getCategories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  
  return data || []
}

// =============================================
// ESTADÍSTICAS
// =============================================

export async function getAdminStats() {
  const supabase = await createClient()
  
  try {
    // Total productos
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    // Productos pendientes
    const { count: pendingProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending')
    
    // Vendedores activos
    const { count: activeVendors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'seller')
    
    // Total ventas
    const { data: orders } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'paid')
    
    const totalSales = orders?.reduce((sum, order) => sum + order.total, 0) || 0
    
    return {
      totalProducts: totalProducts || 0,
      pendingApproval: pendingProducts || 0,
      activeVendors: activeVendors || 0,
      totalSales,
      monthlySales: Math.floor(totalSales * 0.3),
    }
  } catch (error) {
    console.error('Error getting admin stats:', error)
    return {
      totalProducts: 0,
      pendingApproval: 0,
      activeVendors: 0,
      totalSales: 0,
      monthlySales: 0,
    }
  }
}