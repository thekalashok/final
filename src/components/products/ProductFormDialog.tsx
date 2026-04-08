import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Product, ProductCategory, ProductStatus } from "../../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Upload, X, Image as ImageIcon } from "lucide-react";

import { dataService } from "../../services/dataService";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (product: Product) => void;
  onDelete?: (id: string) => void;
}

const statuses: ProductStatus[] = ["active", "inactive", "out_of_stock"];

export default function ProductFormDialog({ open, onOpenChange, product, onSave, onDelete }: ProductFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    category: "amigurumi",
    price: 0,
    cost_price: 0,
    stock: 0,
    image_url: "",
    sku: "",
    status: "active",
  });

  useEffect(() => {
    if (open) {
      dataService.getCategories().then(setCategories);
      setIsDeleting(false);
    }
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: "",
        description: "",
        category: "amigurumi",
        price: 0,
        cost_price: 0,
        stock: 0,
        image_url: "",
        sku: "",
        status: "active",
      });
    }
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: product?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name || "",
      description: formData.description || "",
      category: formData.category || "amigurumi",
      price: Number(formData.price) || 0,
      cost_price: Number(formData.cost_price) || 0,
      stock: Number(formData.stock) || 0,
      image_url: formData.image_url || `https://picsum.photos/seed/${encodeURIComponent(formData.name || 'product')}/400/400`,
      sku: formData.sku || `SKU-${Date.now()}`,
      status: formData.status || "active",
      created_date: product?.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: "admin",
    };
    onSave(newProduct);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        alert("File is too large. Please choose an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    if (product && onDelete) {
      if (isDeleting) {
        onDelete(product.id);
        onOpenChange(false);
      } else {
        setIsDeleting(true);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-bold font-display text-[#3a322b]">
            {product ? "Edit Product" : "New Creation"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Product Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-brand-500"
                placeholder="e.g. Blue Crochet Bag"
                required 
              />
            </div>
            
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Description</Label>
              <Input 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-brand-500"
                placeholder="Briefly describe your craft..."
                required 
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val: ProductCategory) => setFormData(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-brand-500">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize py-3">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: ProductStatus) => setFormData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-brand-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                  {statuses.map(status => (
                    <SelectItem key={status} value={status} className="capitalize py-3">{status.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Selling Price (₹)</Label>
              <Input 
                id="price" 
                type="number" 
                value={formData.price} 
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-brand-500"
                required 
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cost_price" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Cost Price (₹)</Label>
              <Input 
                id="cost_price" 
                type="number" 
                value={formData.cost_price} 
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: Number(e.target.value) }))}
                className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-brand-500"
                required 
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="image_url" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Product Image</Label>
              <div className="flex flex-col gap-3">
                {formData.image_url && (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 group shadow-sm">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <Input 
                      id="image_url" 
                      value={formData.image_url} 
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="Paste image URL..."
                      className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-12 rounded-2xl border-dashed border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all px-4"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
            {product && onDelete && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDelete}
                className={`rounded-2xl h-12 px-6 font-bold transition-all ${isDeleting ? "bg-red-500 text-white border-red-500 hover:bg-red-600" : "text-red-500 border-red-100 hover:bg-red-50"}`}
              >
                {isDeleting ? "Confirm Delete?" : "Delete Product"}
              </Button>
            )}
            <div className="flex-grow" />
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="rounded-2xl h-12 px-6 text-slate-500">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#3a322b] hover:bg-[#4a3f35] rounded-2xl h-12 px-10 text-white font-bold shadow-lg shadow-[#3a322b]/10">
              {product ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
