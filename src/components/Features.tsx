import { motion } from "motion/react";
import { Brain, Cloud, Code2, Globe, Layers, MessageSquare } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Neural Engine",
    description: "Advanced LLM integration with custom fine-tuning capabilities for your specific domain.",
    color: "bg-blue-500/10 text-blue-400"
  },
  {
    icon: Layers,
    title: "Workflow Automation",
    description: "Visual canvas to build complex AI pipelines without writing a single line of code.",
    color: "bg-purple-500/10 text-purple-400"
  },
  {
    icon: MessageSquare,
    title: "Team Collaboration",
    description: "Real-time shared workspaces where teams can interact with AI agents together.",
    color: "bg-emerald-500/10 text-emerald-400"
  },
  {
    icon: Code2,
    title: "API First",
    description: "Robust SDKs and REST APIs to integrate Nexus directly into your existing stack.",
    color: "bg-orange-500/10 text-orange-400"
  },
  {
    icon: Cloud,
    title: "Hybrid Cloud",
    description: "Deploy on our secure cloud or on-premise with full data sovereignty and privacy.",
    color: "bg-pink-500/10 text-pink-400"
  },
  {
    icon: Globe,
    title: "Global Scale",
    description: "Edge deployment ensures low-latency responses for users anywhere in the world.",
    color: "bg-cyan-500/10 text-cyan-400"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Engineered for the <span className="text-gradient">Next Generation</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Everything you need to build, deploy, and scale AI-powered applications 
            with confidence and speed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass p-8 rounded-3xl hover:bg-white/10 transition-all group border-white/5 hover:border-white/20"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4 font-display">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
