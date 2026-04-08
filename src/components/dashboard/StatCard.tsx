import { motion } from "motion/react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color: string;
}

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all rounded-3xl bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon className="w-6 h-6" />
            </div>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-bold font-display">{value}</h3>
            {trendLabel && <p className="text-xs text-slate-400 mt-2">{trendLabel}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
