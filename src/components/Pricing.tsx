import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "0",
    description: "Perfect for individuals and small side projects.",
    features: ["5 AI Workflows", "10,000 API calls", "Basic Support", "Community Access"],
    cta: "Start for Free",
    popular: false
  },
  {
    name: "Pro",
    price: "49",
    description: "For growing teams that need more power and control.",
    features: ["Unlimited Workflows", "100,000 API calls", "Priority Support", "Custom Fine-tuning", "Team Management"],
    cta: "Get Started",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Advanced security and dedicated resources for large orgs.",
    features: ["Dedicated Infrastructure", "Unlimited API calls", "24/7 Premium Support", "SLA Guarantees", "On-premise Deployment"],
    cta: "Contact Sales",
    popular: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-brand-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Choose the plan that fits your current scale. Upgrade as you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative glass p-8 rounded-3xl flex flex-col ${
                plan.popular ? "border-brand-500/50 shadow-2xl shadow-brand-500/10 scale-105 z-10" : "border-white/5"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold font-display mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-display">
                    {plan.price === "Custom" ? "" : "$"}
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && <span className="text-slate-500">/mo</span>}
                </div>
                <p className="text-slate-400 mt-4 text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-brand-400" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  plan.popular
                    ? "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                    : "glass hover:bg-white/10 text-white"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
