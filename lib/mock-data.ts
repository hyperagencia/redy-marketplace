export const mockProducts = [
  {
    id: 1,
    name: "Bicicleta Trek Marlin 7",
    category: "Ciclismo",
    price: 850000,
    condition: "Excelente",
    seller: "Juan Pérez",
    status: "pending",
    image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=500&h=500&fit=crop",
    createdAt: "2024-10-15"
  },
  {
    id: 2,
    name: "Zapatillas Nike Vaporfly",
    category: "Running",
    price: 120000,
    condition: "Muy bueno",
    seller: "María González",
    status: "pending",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
    createdAt: "2024-10-14"
  },
  {
    id: 3,
    name: "Wetsuit Orca S7",
    category: "Natación",
    price: 350000,
    condition: "Bueno",
    seller: "Pedro Silva",
    status: "approved",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=500&h=500&fit=crop",
    createdAt: "2024-10-13"
  },
  {
    id: 4,
    name: "Garmin Forerunner 945",
    category: "Tecnología",
    price: 280000,
    condition: "Excelente",
    seller: "Carlos Ruiz",
    status: "approved",
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&h=500&fit=crop",
    createdAt: "2024-10-12"
  },
  {
    id: 5,
    name: "Tabla SUP Paddle",
    category: "Deportes Acuáticos",
    price: 450000,
    condition: "Muy bueno",
    seller: "Ana Torres",
    status: "pending",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=500&fit=crop",
    createdAt: "2024-10-11"
  },
  {
    id: 6,
    name: "Casco Giro Aether",
    category: "Ciclismo",
    price: 95000,
    condition: "Excelente",
    seller: "Roberto Díaz",
    status: "approved",
    image: "https://images.unsplash.com/photo-1575617117316-b0ac6a67ca93?w=500&h=500&fit=crop",
    createdAt: "2024-10-10"
  },
];

export const categories = [
  { name: "Running", icon: "👟", count: 156, slug: "running" },
  { name: "Ciclismo", icon: "🚴", count: 243, slug: "ciclismo" },
  { name: "Natación", icon: "🏊", count: 89, slug: "natacion" },
  { name: "Triatlón", icon: "🏃", count: 67, slug: "triatlon" },
  { name: "Fitness", icon: "💪", count: 134, slug: "fitness" },
  { name: "Tecnología", icon: "⌚", count: 98, slug: "tecnologia" },
];

export const stats = {
  totalProducts: 689,
  pendingApproval: 12,
  activeVendors: 145,
  totalSales: 15600000,
  monthlySales: 3200000,
  averageCommission: 15,
};

export type Product = typeof mockProducts[0];
export type Category = typeof categories[0];
export type Stats = typeof stats;

export const mockVendors = [
  {
    id: 1,
    name: "Juan Pérez",
    email: "juan.perez@email.com",
    phone: "+56 9 1234 5678",
    status: "active",
    verified: true,
    productsCount: 12,
    totalSales: 3500000,
    commission: 525000,
    rating: 4.8,
    joinedDate: "2024-08-15",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
  },
  {
    id: 2,
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "+56 9 8765 4321",
    status: "active",
    verified: true,
    productsCount: 8,
    totalSales: 2100000,
    commission: 315000,
    rating: 4.9,
    joinedDate: "2024-09-01",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
  },
  {
    id: 3,
    name: "Pedro Silva",
    email: "pedro.silva@email.com",
    phone: "+56 9 5555 6666",
    status: "active",
    verified: false,
    productsCount: 5,
    totalSales: 1800000,
    commission: 270000,
    rating: 4.5,
    joinedDate: "2024-10-05",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro",
  },
  {
    id: 4,
    name: "Carlos Ruiz",
    email: "carlos.ruiz@email.com",
    phone: "+56 9 7777 8888",
    status: "pending",
    verified: false,
    productsCount: 0,
    totalSales: 0,
    commission: 0,
    rating: 0,
    joinedDate: "2024-10-20",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
  },
  {
    id: 5,
    name: "Ana Torres",
    email: "ana.torres@email.com",
    phone: "+56 9 3333 4444",
    status: "suspended",
    verified: true,
    productsCount: 15,
    totalSales: 4200000,
    commission: 630000,
    rating: 3.2,
    joinedDate: "2024-07-10",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
  },
  {
    id: 6,
    name: "Roberto Díaz",
    email: "roberto.diaz@email.com",
    phone: "+56 9 9999 0000",
    status: "active",
    verified: true,
    productsCount: 20,
    totalSales: 6800000,
    commission: 1020000,
    rating: 4.7,
    joinedDate: "2024-06-20",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto",
  },
];

export type Vendor = typeof mockVendors[0];