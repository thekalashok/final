import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Filter, ShoppingCart, Plus, Minus, X, CreditCard, User, MapPin, Phone, Package, LogOut, History, Settings, Lock, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { dataService } from "../../services/dataService";
import { Product, LineItem, Order, Address } from "../../types";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { ScrollArea } from "../../components/ui/scroll-area";
import { toast } from "sonner";
import { Toaster } from "../../components/ui/sonner";

export default function ShopHome() {
  const [products, setProducts] = useState<Product[]>(() => {
    const initial = dataService.getInitialData("PRODUCTS");
    return initial.filter((p: any) => p.status === "active");
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [categories, setCategories] = useState<{ id: string; label: string }[]>(() => {
    const initial = dataService.getInitialData("CATEGORIES");
    return [
      { id: "all", label: "All" },
      ...initial
        .map((doc: any) => doc.name)
        .filter((cat: any) => typeof cat === 'string' && cat.length > 0)
        .map((cat: string) => ({ id: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))
    ];
  });
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const unsubscribeProducts = dataService.subscribe("PRODUCTS", (newProducts) => {
      setProducts(newProducts.filter((p: any) => p.status === "active"));
    });

    const unsubscribeCategories = dataService.subscribe("CATEGORIES", (newCats) => {
      setCategories([
        { id: "all", label: "All" },
        ...newCats
          .map((doc: any) => doc.name)
          .filter((cat: any) => typeof cat === 'string' && cat.length > 0)
          .map((cat: string) => ({ id: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))
      ]);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const filteredProducts = products.filter(p => 
    (category === "all" || p.category.toLowerCase().replace(" ", "_") === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d2519]">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="w-full bg-[#fdfbf7] pt-4 md:pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center gap-6 md:gap-8">
          <div className="w-full grid grid-cols-3 items-center">
            <div className="flex justify-start">
              <img 
                src="https://raw.githubusercontent.com/thekalashok/final/76c07d6c3acedc538115b5115882461db0e12846/public/40f1609d-e094-4df1-a6a2-5284d5f6220a.png" 
                alt="KALAA Logo" 
                className="h-20 md:h-32 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex flex-col items-center text-center">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold tracking-[0.4em] text-[#4a3f35] uppercase">
                KALAA
              </h1>
              <p className="text-[8px] md:text-[10px] tracking-[0.2em] text-[#8c7e6d] uppercase mt-1 font-medium">
                Handcrafted with Love
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 md:gap-3">
            </div>
          </div>

        {/* Categories */}
          <div className="w-full flex flex-wrap justify-center gap-4 md:gap-6 mt-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`text-sm md:text-base font-serif transition-all px-6 py-1.5 rounded-full ${
                  category === cat.id 
                    ? "bg-[#3a322b] text-white" 
                    : "text-[#8c7e6d] hover:text-[#3a322b]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Collection Title Section */}
          <div className="w-full flex flex-col items-center mt-16 md:mt-24 mb-6">
            <p className="text-[10px] md:text-[12px] tracking-[0.4em] text-[#8c7e6d] uppercase font-medium mb-3">
              EST. WITH LOVE
            </p>
            <h2 className="font-serif text-5xl md:text-8xl font-bold text-[#3a322b] mb-8 md:mb-12">
              Our Collection
            </h2>
            <div className="w-full flex items-center justify-center gap-4 md:gap-6">
              <div className="h-[1px] bg-[#ece4d5] flex-grow max-w-[150px] md:max-w-[250px]" />
              <div className="w-2 h-2 md:w-3 md:h-3 bg-[#c8b594] rotate-45" />
              <div className="h-[1px] bg-[#ece4d5] flex-grow max-w-[150px] md:max-w-[250px]" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#c8b594]">
            <Search className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-xl font-medium">No products found</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {filteredProducts.map((product, index) => {
              // Create a zig-zag pattern of heights
              const aspectRatios = [
                "aspect-[4/5]",   // Medium
                "aspect-square",  // Small
                "aspect-[3/4]",   // Tall
                "aspect-[4/3]",   // Wide/Short
                "aspect-[2/3]",   // Very Tall
              ];
              const aspectClass = aspectRatios[index % aspectRatios.length];

              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="break-inside-avoid group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="bg-[#f7f3eb] rounded-[1.5rem] overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border border-[#ece4d5]/50">
                    <div className={`relative overflow-hidden bg-white ${aspectClass} group/image`}>
                      <div id={`product-image-container-${product.id}`} className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {product.image_urls && product.image_urls.length > 0 ? (
                          product.image_urls.map((url, idx) => (
                            <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                              <img 
                                src={url} 
                                alt={`${product.name} - ${idx + 1}`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))
                        ) : product.image_url ? (
                          <div className="w-full h-full flex-shrink-0 snap-center relative">
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center text-[#c8b594]">
                            <Package className="w-8 h-8 opacity-30" />
                          </div>
                        )}
                      </div>
                      
                      {/* Arrows */}
                      {product.image_urls && product.image_urls.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const container = document.getElementById(`product-image-container-${product.id}`);
                              if (container) container.scrollBy({ left: -container.offsetWidth, behavior: 'smooth' });
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
                          >
                            <ChevronLeft className="w-4 h-4 text-[#3a322b]" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const container = document.getElementById(`product-image-container-${product.id}`);
                              if (container) container.scrollBy({ left: container.offsetWidth, behavior: 'smooth' });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
                          >
                            <ChevronRight className="w-4 h-4 text-[#3a322b]" />
                          </button>
                        </>
                      )}
                      
                      {/* Dots indicator if multiple images */}
                      {product.image_urls && product.image_urls.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 pointer-events-none z-10">
                          {product.image_urls.map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm" />
                          ))}
                        </div>
                      )}

                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <a 
                          href={`https://wa.me/91XXXXXXXXXX?text=I'm interested in ${product.name}. Price: ₹${product.price}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#25D366] opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a 
                          href={`https://www.instagram.com/direct/new/?text=I'm interested in ${product.name}. Price: ₹${product.price}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#E1306C] opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm"
                        >
                          <span className="font-bold text-xs">IG</span>
                        </a>
                      </div>
                    </div>
                    <div className="p-4 text-left">
                      <h3 className="font-serif text-sm font-bold text-[#4a3f35] leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-[#b0966a] mt-1 font-display">
                        ₹{product.price}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#f7f3eb] py-12 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="font-serif text-2xl font-bold text-[#3a322b] tracking-widest uppercase mb-2">
              KALAA
            </h2>
            <p className="text-xs text-[#8c7e6d] tracking-widest uppercase">
              Handcrafted with Love
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-[#8c7e6d]">
            <a href="#" className="hover:text-[#3a322b] transition-colors">Shop</a>
            <a href="#" className="hover:text-[#3a322b] transition-colors">About Us</a>
            <a href="#" className="hover:text-[#3a322b] transition-colors">Contact</a>
          </div>
          
          <div className="text-xs text-[#8c7e6d] text-center md:text-right">
            <p>&copy; 2026 KALAA. All rights reserved.</p>
            <p className="mt-1">Designed for Artisans.</p>
            <button 
              onClick={() => navigate("/admin/login")}
              className="mt-4 opacity-0 hover:opacity-100 transition-opacity text-[10px] uppercase tracking-widest"
            >
              Admin Access
            </button>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] p-0 overflow-hidden md:rounded-[2rem] border-none bg-[#fdfbf7] m-0 rounded-none">
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Header inside modal */}
            <div className="sticky top-0 z-20 bg-[#fdfbf7] border-b border-[#ece4d5] px-4 py-3 flex items-center justify-between">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="flex items-center gap-2 text-sm font-medium text-[#8c7e6d] hover:text-[#3a322b] transition-colors bg-[#f7f3eb] px-4 py-2 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Shop
              </button>
            </div>

            {/* Image Section */}
            <div className="w-full relative bg-[#fdfbf7] p-4">
              <div className="relative rounded-2xl overflow-hidden group">
                <div id="modal-image-container" className="flex w-full h-[50vh] md:h-[60vh] overflow-x-auto snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {selectedProduct?.image_urls && selectedProduct.image_urls.length > 0 ? (
                    selectedProduct.image_urls.map((url, idx) => (
                      <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                        <img 
                          src={url} 
                          alt={`${selectedProduct.name} - ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                          {idx + 1} / {selectedProduct.image_urls?.length}
                        </div>
                      </div>
                    ))
                  ) : selectedProduct?.image_url ? (
                    <div className="w-full h-full flex-shrink-0 snap-center relative">
                      <img 
                        src={selectedProduct.image_url} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                        1 / 1
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center text-[#c8b594] bg-white">
                      <Package className="w-16 h-16 opacity-20" />
                    </div>
                  )}
                </div>
                
                {/* Arrows */}
                {selectedProduct?.image_urls && selectedProduct.image_urls.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const container = document.getElementById('modal-image-container');
                        if (container) container.scrollBy({ left: -container.offsetWidth, behavior: 'smooth' });
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronLeft className="w-6 h-6 text-[#3a322b]" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const container = document.getElementById('modal-image-container');
                        if (container) container.scrollBy({ left: container.offsetWidth, behavior: 'smooth' });
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronRight className="w-6 h-6 text-[#3a322b]" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {selectedProduct?.image_urls && selectedProduct.image_urls.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {selectedProduct.image_urls.map((url, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        const container = document.getElementById('modal-image-container');
                        if (container) {
                          container.scrollTo({ left: idx * container.offsetWidth, behavior: 'smooth' });
                        }
                      }}
                      className="w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent focus:border-[#c8b594] transition-colors"
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="w-full p-6 md:p-8 flex flex-col">
              <p className="text-[11px] tracking-[0.2em] text-[#c8b594] uppercase font-medium mb-3">
                {selectedProduct?.category.replace("_", " ")}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#3a322b] mb-4">
                {selectedProduct?.name}
              </h2>
              
              <div className="flex items-center gap-3 mb-8">
                {(selectedProduct?.cost_price ?? 0) > (selectedProduct?.price ?? 0) && (
                  <span className="text-2xl text-[#8c7e6d] line-through decoration-1">₹{selectedProduct?.cost_price}</span>
                )}
                <span className="text-4xl font-bold text-[#d9774b]">₹{selectedProduct?.price}</span>
                {(selectedProduct?.cost_price ?? 0) > (selectedProduct?.price ?? 0) && (
                  <span className="bg-[#fdf3eb] text-[#d9774b] text-sm font-medium px-3 py-1 rounded-sm ml-2">
                    {Math.round((((selectedProduct?.cost_price ?? 0) - (selectedProduct?.price ?? 0)) / (selectedProduct?.cost_price ?? 1)) * 100)}% OFF
                  </span>
                )}
              </div>

              <div className="border-t border-b border-[#ece4d5] py-6 mb-8 space-y-5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8c7e6d] uppercase text-xs tracking-widest">Product Code</span>
                  <span className="font-serif font-bold text-[#3a322b] text-base">{selectedProduct?.sku || '000'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8c7e6d] uppercase text-xs tracking-widest">Category</span>
                  <span className="font-serif font-bold text-[#3a322b] text-base capitalize">{selectedProduct?.category.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8c7e6d] uppercase text-xs tracking-widest">Availability</span>
                  <span className="font-serif font-bold text-[#3a322b] text-base">
                    {selectedProduct?.stock && selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-8">
                <a 
                  href={`https://wa.me/917304660232?text=${encodeURIComponent(`Product Name: ${selectedProduct?.name}\nPrice: ₹${selectedProduct?.price}\nProduct ID: ${selectedProduct?.sku || 'N/A'}\n\nPlease provide more details`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 bg-[#4ade80] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all shadow-sm text-lg"
                >
                  <Phone className="w-5 h-5" />
                  Buy via WhatsApp
                </a>
                <button 
                  onClick={() => {
                    const message = `Product Name: ${selectedProduct?.name}\nPrice: ₹${selectedProduct?.price}\nProduct ID: ${selectedProduct?.sku || 'N/A'}\n\nPlease provide more details`;
                    navigator.clipboard.writeText(message).then(() => {
                      toast.success("Product details copied! Paste them in the chat.");
                      window.open('https://www.instagram.com/kalaa_.handmade?igsh=NHJuMmkwcXg2YXBu', '_blank');
                    }).catch(() => {
                      window.open('https://www.instagram.com/kalaa_.handmade?igsh=NHJuMmkwcXg2YXBu', '_blank');
                    });
                  }}
                  className="w-full h-14 bg-gradient-to-r from-[#ff9a8b] to-[#ff6a88] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm text-lg"
                >
                  <span className="font-bold">DM on Instagram</span>
                </button>
              </div>

              <div className="space-y-3 mb-10 text-sm text-[#8c7e6d]">
                <p className="flex items-start gap-2">
                  <span className="text-[#d9774b] mt-0.5">✦</span> 
                  <span>Clicking "Buy" will open WhatsApp with your product details pre-filled.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#ec4899] mt-0.5">✦</span> 
                  <span>Instagram: your product details are copied to clipboard — just paste them in the DM.</span>
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#3a322b] mb-3">Description</h3>
                  <div className="text-sm text-[#4a3f35] space-y-2 leading-relaxed">
                    {selectedProduct?.description.split('\n').map((line, i) => (
                      <p key={i}>• {line}</p>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-[#3a322b] mb-3">Shipping Info</h3>
                  <div className="space-y-3 text-sm text-[#4a3f35]">
                    {selectedProduct?.shipping_info ? (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-[#c8b594]"><Package className="w-4 h-4" /></div>
                        <p>{selectedProduct.shipping_info}</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-[#c8b594]"><History className="w-4 h-4" /></div>
                          <p>Each piece is made to order and takes 5-6 days to prepare.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-[#c8b594]"><Package className="w-4 h-4" /></div>
                          <p>Delivery takes 5-6 days after dispatch, depending on your location.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
