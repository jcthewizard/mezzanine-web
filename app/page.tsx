"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, LineChart, Users, ArrowUpRight } from "lucide-react";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";

const services = [
  {
    title: "Investment Opportunities",
    description:
      "We identify assets in transitional situations—receivership, partnership changes, or market dislocations—and create value through strategic repositioning.",
    icon: TrendingUp,
  },
  {
    title: "Market Intelligence",
    description:
      "Deep insight into market timing, sector performance, and capital market trends informs every investment decision we make on behalf of our clients.",
    icon: LineChart,
  },
  {
    title: "Client Services",
    description:
      "We build lasting relationships founded on trust. Our clients receive tailored strategies and dedicated attention befitting their investment goals.",
    icon: Users,
  },
  {
    title: "Exit Planning",
    description:
      "Strategic positioning from day one ensures optimal outcomes. We plan for success, navigating competitive markets with precision and foresight.",
    icon: ArrowUpRight,
  },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Introduction Section */}
      <section className="py-32 lg:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
                Our Approach
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight mb-8">
                Experience You
                <br />
                Can Trust
              </h2>
              <div className="w-12 h-px bg-red mb-8" />
            </motion.div>

            {/* Right Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <p className="text-slate text-lg leading-relaxed">
                Mezzanine Properties, Inc. provides comprehensive advice, execution,
                asset management, and investment management services to clients engaged
                in buying, selling, investing in, financing, or developing real estate.
              </p>
              <p className="text-slate leading-relaxed">
                Our solutions are tailored to meet the objectives of private and
                institutional owners and investors, as well as corporate owners and
                occupiers seeking strategic real estate counsel.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-charcoal text-sm tracking-wide hover:text-red transition-colors group mt-4"
              >
                About Our Firm
                <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 lg:py-40 bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mb-20"
          >
            <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
              What We Do
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight">
              Expertise Across the
              <br />
              Investment Lifecycle
            </h2>
          </motion.div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <ServiceCard
                key={service.title}
                title={service.title}
                description={service.description}
                icon={service.icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-charcoal">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {[
              { value: "20+", label: "Years Experience" },
              { value: "$500M+", label: "Assets Managed" },
              { value: "100+", label: "Transactions" },
              { value: "98%", label: "Client Retention" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center lg:text-left"
              >
                <p className="font-serif text-4xl lg:text-5xl text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-white/50 text-sm tracking-wide">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 lg:py-40 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
              Let&apos;s Connect
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight mb-8">
              Ready to Explore
              <br />
              Opportunities?
            </h2>
            <p className="text-slate text-lg max-w-xl mx-auto mb-12">
              We welcome the opportunity to discuss how Mezzanine Properties
              can help you achieve your investment objectives.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-10 py-4 bg-red text-white font-serif text-sm tracking-wide hover:bg-red-dark transition-colors"
            >
              Start a Conversation
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
