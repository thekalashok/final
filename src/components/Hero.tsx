import { motion } from "motion/react";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                New: Nexus v2.0 is here
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] mb-6">
              Collaborative <br />
              <span className="text-gradient">Intelligence</span> <br />
              for Modern Teams
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-lg leading-relaxed">
              Nexus AI bridges the gap between human creativity and machine precision. 
              Deploy custom AI workflows that scale with your team's ambition.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-2 group shadow-lg shadow-brand-500/20">
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="glass hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all">
                View Demo
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-8 border-t border-white/5 pt-8">
              <div className="flex flex-col">
                <span className="text-2xl font-bold font-display">500k+</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Active Users</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold font-display">99.9%</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Uptime</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold font-display">24/7</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Support</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 glass rounded-3xl p-4 shadow-2xl border-white/20">
              <img 
                src="https://picsum.photos/seed/nexus/1200/800" 
                alt="Nexus Dashboard" 
                className="rounded-2xl w-full"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 -right-6 glass p-4 rounded-2xl shadow-xl hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Zap className="text-green-400 w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Processing Speed</div>
                    <div className="text-sm font-bold">+142% Faster</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-6 -left-6 glass p-4 rounded-2xl shadow-xl hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                    <Shield className="text-brand-400 w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Security Status</div>
                    <div className="text-sm font-bold text-green-400">Enterprise Grade</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full" />
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-white/5 rounded-full opacity-50" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
