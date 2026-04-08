import { useState, useEffect } from "react";
import { Plus, Search, Filter, Package, Tag } from "lucide-react";
import { dataService } from "../services/dataService";
import { Product } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import ProductCard from "../components/products/ProductCard";
import ProductFormDialog from "../components/products/ProductFormDialog";
import CategoryManager from "../components/products/CategoryManager";
import { toast } from "sonner";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
    // Subscribe to live updates
    const unsubscribe = dataService.subscribe("PRODUCTS", (newProducts) => {
      setProducts(newProducts);
    });
    return () => unsubscribe();
  }, []);

  const loadProducts = async () => {
    const initialProducts = await dataService.getProducts();
    setProducts(initialProducts);
  };

  const handleSave = async (product: Product) => {
    await dataService.saveProduct(product);
    setIsDialogOpen(false);
    setEditingProduct(null);
    toast.success(editingProduct ? "Product updated!" : "Product created!");
  };

  const handleDelete = async (id: string) => {
    await dataService.deleteProduct(id);
    toast.success("Product deleted successfully");
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-[#3a322b]">Product Catalog</h1>
          <p className="text-slate-400 text-sm">Manage your handcrafted items and pricing.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setIsCategoryManagerOpen(true)}
            variant="outline" 
            className="h-10 rounded-xl border-slate-100 bg-white px-4 text-slate-600 hover:text-[#3a322b] text-sm"
          >
            <Tag className="w-4 h-4 mr-2" />
            Categories
          </Button>
          <Button 
            onClick={() => {
              setEditingProduct(null);
              setIsDialogOpen(true);
            }}
            className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-6 h-10 font-bold shadow-lg shadow-brand-500/20 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            className="pl-10 h-10 rounded-xl bg-white border-slate-100 focus-visible:ring-brand-500 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-10 rounded-xl border-slate-100 bg-white px-4 text-sm">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Package className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-xl font-medium">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id}>
              <ProductCard
                product={product}
                onEdit={(p) => {
                  setEditingProduct(p);
                  setIsDialogOpen(true);
                }}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      <ProductFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <CategoryManager 
        open={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
        onUpdate={() => loadProducts()}
      />
    </div>
  );
}
