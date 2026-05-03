import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Product, ProductCategory, ProductStatus } from "../../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "../../supabase";
import { dataService } from "../../services/dataService";
import { toast } from "sonner";

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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

  const [imageUrlInput, setImageUrlInput] = useState("");

  useEffect(() => {
    // Subscribe to live updates for categories
    const unsubscribe = dataService.subscribe("CATEGORIES", (newCategories) => {
      const catNames = newCategories.map((c: any) => typeof c === 'string' ? c : c.name);
      setCategories(catNames);
    });

    if (open) {
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

    return () => unsubscribe();
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
      image_urls: formData.image_urls || [],
      sku: formData.sku || `SKU-${Date.now()}`,
      status: formData.status || "active",
      shipping_info: formData.shipping_info || "",
      created_date: product?.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: "admin",
    };
    onSave(newProduct);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload images.");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload-telegram", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Upload to Telegram failed");
        }

        const data = await response.json();
        // data.url is already returned as a relative path like "/api/file/..." from the server
        const publicUrl = data.url;
        
        // Save metadata to database
        await dataService.saveMediaMetadata({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size
        });

        setFormData(prev => ({
          ...prev,
          image_urls: [...(prev.image_urls || []), publicUrl],
          image_url: prev.image_url || publicUrl
        }));
        
        toast.success("Image uploaded to Telegram successfully!");
      } catch (error: any) {
        console.error("Upload failed:", error);
        toast.error(`Upload failed: ${error.message}. Please check your Telegram BOT_TOKEN and CHAT_ID in the server settings.`);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newUrls = [...(prev.image_urls || [])];
      newUrls.splice(index, 1);
      return {
        ...prev,
        image_urls: newUrls,
        image_url: newUrls.length > 0 ? newUrls[0] : ""
      };
    });
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
      <DialogContent className="sm:max-w-2xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col">
        <DialogHeader className="p-8 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold font-display text-[#3a322b]">
            {product ? "Edit Product" : "New Creation"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-6 scrollbar-hide">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
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
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Description</Label>
                <textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[120px] p-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 text-sm"
                  placeholder="Briefly describe your craft..."
                  required 
                />
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Stock Quantity</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  value={formData.stock} 
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-brand-500"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">SKU / Product Code</Label>
                <Input 
                  id="sku" 
                  value={formData.sku} 
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-brand-500"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="shipping_info" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Shipping Info</Label>
                <textarea 
                  id="shipping_info" 
                  value={formData.shipping_info || ""} 
                  onChange={(e) => setFormData(prev => ({ ...prev, shipping_info: e.target.value }))}
                  className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 text-sm"
                  placeholder="e.g. Each piece is made to order and takes 5-6 days to prepare."
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="image_url" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Product Images</Label>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-3">
                    {(formData.image_urls && formData.image_urls.length > 0 ? formData.image_urls : (formData.image_url ? [formData.image_url] : [])).map((url, idx) => (
                      <div key={idx} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-100 group shadow-sm">
                        <img 
                          src={url} 
                          alt={`Preview ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow">
                      <Input 
                        id="image_url" 
                        value={imageUrlInput} 
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (imageUrlInput) {
                              if (imageUrlInput.startsWith('data:image')) {
                                toast.error("Base64 images are not supported. Please paste a direct image URL.");
                                return;
                              }
                              setFormData(prev => ({
                                ...prev,
                                image_urls: [...(prev.image_urls || []), imageUrlInput],
                                image_url: prev.image_url ? prev.image_url : imageUrlInput
                              }));
                              setImageUrlInput("");
                            }
                          }
                        }}
                        placeholder="Paste image URL and press Enter..."
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
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-12 w-full sm:w-auto rounded-2xl border-dashed border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all px-6"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {uploadProgress !== null ? `Uploading ${Math.round(uploadProgress)}%` : "Uploading..."}
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-4 border-t border-slate-50 flex-shrink-0 flex flex-col sm:flex-row gap-3">
            {product && onDelete && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDelete}
                className={`rounded-2xl h-14 px-8 font-bold transition-all ${isDeleting ? "bg-red-500 text-white border-red-500 hover:bg-red-600" : "text-red-500 border-red-100 hover:bg-red-50"}`}
              >
                {isDeleting ? "Confirm Delete?" : "Delete Product"}
              </Button>
            )}
            <div className="flex-grow" />
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="rounded-2xl h-14 px-8 text-slate-500">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#3a322b] hover:bg-[#4a3f35] rounded-2xl h-14 px-12 text-white font-bold shadow-lg shadow-[#3a322b]/10">
              {product ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
