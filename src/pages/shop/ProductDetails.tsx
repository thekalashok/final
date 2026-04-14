import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, ShoppingBag, Star, ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { dataService } from "../../services/dataService";
import { Product } from "../../types";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const products = await dataService.getProducts();
        const found = products.find(p => p.id === id);
        if (found) {
          setProduct(found);
        } else {
          toast.error("Product not found");
          navigate("/shop");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#c8b594]/20 border-t-[#c8b594] rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const images = product.image_urls && product.image_urls.length > 0 
    ? product.image_urls 
    : [product.image_url];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#3a322b] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fdfbf7]/80 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex flex-col items-start">
              <h1 className="font-serif text-xl md:text-2xl font-bold tracking-widest text-[#3a322b] uppercase leading-none">
                Kalaa
              </h1>
              <span className="text-[8px] tracking-[0.3em] text-[#8c7e6d] uppercase font-medium">
                HANDMADE
              </span>
            </div>
          </div>

          <div className="flex-grow max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7e6d]" />
              <input 
                type="text" 
                placeholder="Search products..." 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/?search=${(e.target as HTMLInputElement).value}`);
                  }
                }}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-[#f7f3eb] border-none focus:ring-1 focus:ring-[#c8b594] text-sm text-[#3a322b]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-[#3a322b] hover:bg-[#f7f3eb] rounded-full transition-colors">
              <ShoppingBag className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-[#8c7e6d] hover:text-[#3a322b] transition-colors bg-[#f7f3eb] px-4 py-2 rounded-xl mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </button>

        {/* Product Image Section */}
        <div className="space-y-6">
          <div className="relative aspect-[4/5] md:aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-white shadow-xl group">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {/* Carousel Controls */}
            {images.length > 1 && (
              <>
                <div className="absolute top-6 right-6 bg-black/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                  {currentImageIndex + 1} / {images.length}
                </div>
                
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-[#3a322b] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-[#3a322b] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex justify-center gap-3 overflow-x-auto py-2 scrollbar-hide">
              {images.map((url, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                    currentImageIndex === idx ? "border-[#c8b594] scale-105" : "border-transparent opacity-60"
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}

          {/* Product Info */}
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold tracking-[0.3em] text-[#8c7e6d] uppercase">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 bg-[#fdf3eb] text-[#d9774b] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <Star className="w-3 h-3 fill-current" />
                  Featured
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#3a322b] leading-tight">
                {product.name}
              </h2>
              <div className="flex items-baseline gap-4">
                <span className="text-3xl md:text-4xl font-bold text-[#d9774b]">₹{product.price}</span>
                {product.cost_price > product.price && (
                  <span className="text-xl text-[#8c7e6d] line-through opacity-60">₹{product.cost_price}</span>
                )}
              </div>
            </div>

            <div className="prose prose-stone max-w-none">
              <p className="text-[#4a3f35] leading-relaxed text-lg">
                {product.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
              <a 
                href={`https://wa.me/917304660232?text=${encodeURIComponent(`I'm interested in ${product.name} (₹${product.price}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 h-16 bg-[#25D366] text-white rounded-2xl font-bold text-lg hover:bg-[#1eb954] transition-all shadow-lg transform hover:-translate-y-1 active:scale-95"
              >
                <Phone className="w-6 h-6" />
                Order on WhatsApp
              </a>
              <button 
                onClick={() => {
                  window.open('https://www.instagram.com/kalaa_.handmade', '_blank');
                }}
                className="flex items-center justify-center gap-3 h-16 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white rounded-2xl font-bold text-lg hover:opacity-95 transition-all shadow-lg transform hover:-translate-y-1 active:scale-95"
              >
                <MessageCircle className="w-6 h-6" />
                DM on Instagram
              </button>
            </div>

            {/* Additional Info */}
            <div className="bg-[#f7f3eb] rounded-[2rem] p-8 space-y-6 mt-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#d9774b] flex-shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#3a322b]">Handcrafted Quality</h4>
                  <p className="text-sm text-[#8c7e6d]">Each piece is uniquely made with attention to every detail.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#d9774b] flex-shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#3a322b]">Shipping Info</h4>
                  <p className="text-sm text-[#8c7e6d]">{product.shipping_info || "Standard shipping takes 5-7 business days."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#f7f3eb] py-12 px-6 mt-12 text-center">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-[#3a322b] tracking-widest uppercase mb-2">
            KALAA
          </h2>
          <p className="text-xs text-[#8c7e6d] tracking-widest uppercase mb-8">
            HANDMADE
          </p>
          <p className="text-xs text-[#8c7e6d]">
            &copy; 2026 KALAA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
