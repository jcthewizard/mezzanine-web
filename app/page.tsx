"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, LineChart, Users, ArrowUpRight } from "lucide-react";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import FDICNews from "@/components/FDICNews";

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

      {/* FDIC News Strip */}
      <FDICNews />

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

      {/* Portfolio Section */}
      <section className="py-32 lg:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-16"
          >
            <div>
              <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
                Featured Portfolio
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight">
                Select Investments
              </h2>
            </div>
            <p className="text-slate max-w-md mt-6 md:mt-0">
              A curated selection from our portfolio of commercial real estate
              investments across the Pacific Northwest.
            </p>
          </motion.div>

          {/* Portfolio Grid - Asymmetric Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Large Featured Image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 group relative overflow-hidden"
            >
              <div className="aspect-[4/3] lg:aspect-[16/12] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                  alt="Modern Office Tower"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-white/70 text-sm tracking-wide mb-2">Office Tower</p>
                <h3 className="font-serif text-2xl text-white">Metropolitan Center</h3>
                <p className="text-white/60 text-sm mt-2">Seattle, WA</p>
              </div>
            </motion.div>

            {/* Right Column - Stacked Images */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="group relative overflow-hidden"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop"
                    alt="Luxury Residential Complex"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="text-white/70 text-sm tracking-wide mb-1">Mixed-Use Development</p>
                  <h3 className="font-serif text-xl text-white">Bellevue Towers</h3>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="group relative overflow-hidden"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
                    alt="Modern Office Space"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="text-white/70 text-sm tracking-wide mb-1">Class A Office</p>
                  <h3 className="font-serif text-xl text-white">Innovation Campus</h3>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="group relative overflow-hidden"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2074&auto=format&fit=crop"
                  alt="Retail Development"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-white/70 text-sm tracking-wide mb-1">Retail</p>
                <h3 className="font-serif text-xl text-white">Harbor Square</h3>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="group relative overflow-hidden"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1464938050520-ef2571f00eb9?q=80&w=2074&auto=format&fit=crop"
                  alt="Industrial Warehouse"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-white/70 text-sm tracking-wide mb-1">Industrial</p>
                <h3 className="font-serif text-xl text-white">Pacific Logistics</h3>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="group relative overflow-hidden"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1582407947810-f797428a0448?q=80&w=2940&auto=format&fit=crop"
                  alt="Corporate Headquarters"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-white/70 text-sm tracking-wide mb-1">Corporate HQ</p>
                <h3 className="font-serif text-xl text-white">Cascade Tower</h3>
              </div>
            </motion.div>
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
              className="inline-flex items-center justify-center px-10 py-4 bg-red text-white text-sm tracking-wide hover:bg-red-dark transition-colors"
            >
              Start a Conversation
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
