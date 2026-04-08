import { useState } from "react";
import { Product } from "../../types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Edit2, Trash2, Package, Check, X } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  inactive: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  out_of_stock: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all rounded-[1.5rem] bg-white group">
      <div className="h-32 relative overflow-hidden bg-slate-50">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <Badge variant="outline" className={`absolute top-2 left-2 capitalize rounded-full px-2 py-0 border-none backdrop-blur-md text-[9px] font-bold ${statusColors[product.status]}`}>
          {product.status.replace("_", " ")}
        </Badge>
      </div>
      <CardHeader className="p-3 pb-1">
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0">
            <CardTitle className="text-sm font-bold font-display text-[#3a322b] truncate">{product.name}</CardTitle>
            <p className="text-slate-400 text-[9px] uppercase tracking-widest mt-0.5 truncate">{product.category}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold font-display text-[#b0966a]">₹{product.price}</p>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="px-3 pb-3 pt-1 flex gap-1">
        {!isConfirming ? (
          <>
            <Button 
              variant="outline" 
              className="flex-grow h-8 rounded-lg border-slate-100 hover:bg-slate-50 text-[10px] font-bold text-[#8c7e6d]"
              onClick={() => onEdit(product)}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              className="w-8 h-8 p-0 rounded-lg border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100"
              onClick={() => setIsConfirming(true)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <div className="flex w-full gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:bg-slate-100"
              onClick={() => setIsConfirming(false)}
            >
              <X className="w-3 h-3" />
            </Button>
            <Button 
              className="flex-grow h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold"
              onClick={() => onDelete(product.id)}
            >
              <Check className="w-3 h-3 mr-1" />
              Confirm
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
