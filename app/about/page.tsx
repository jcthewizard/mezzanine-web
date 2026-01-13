"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, Shield, Handshake, TrendingUp, ArrowUpRight } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Strategic Focus",
    description:
      "We pursue opportunities with precision, focusing on assets that offer the greatest potential for value creation.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description:
      "Our reputation is built on transparency, honesty, and unwavering commitment to our clients' interests.",
  },
  {
    icon: Handshake,
    title: "Partnership",
    description:
      "We work alongside our clients as true partners, aligning our success with theirs in every engagement.",
  },
  {
    icon: TrendingUp,
    title: "Results",
    description:
      "Our track record speaks for itself—we deliver measurable outcomes that exceed expectations.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-charcoal/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-charcoal/20" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-32 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl"
          >
            <p className="text-red text-sm tracking-[0.3em] uppercase mb-8">
              About Us
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-[1.15] mb-8">
              Decades of
              <br />
              Excellence
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-xl leading-relaxed">
              A trusted partner in commercial real estate investment
              and asset management since our founding.
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      </section>

      {/* Story Section */}
      <section className="py-32 lg:py-40 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
              Our Story
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight mb-8">
              A Legacy of
              <br />
              Trusted Counsel
            </h2>
            <div className="w-12 h-px bg-red mb-16" />

            <div className="space-y-8 text-slate leading-loose text-lg">
              <p>
                Mezzanine Properties, Inc. provides comprehensive advice, execution,
                asset management, and investment management services to clients engaged
                in buying, selling, investing in, financing, or developing real estate
                and real estate-related assets.
              </p>
              <p>
                Our solutions are tailored to meet the objectives of private and
                institutional owners and investors, as well as corporate owners and
                occupiers. We take pride in our ability to navigate complex transactions
                and deliver exceptional outcomes.
              </p>
              <p>
                Based in Bellevue, Washington, we serve clients throughout the
                Pacific Northwest and beyond, combining local expertise with a
                sophisticated national perspective.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-32 lg:py-40 bg-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mb-20"
          >
            <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
              Our Values
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight">
              Principles That
              <br />
              Guide Us
            </h2>
          </motion.div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <value.icon size={28} strokeWidth={1.5} className="text-red mb-6" />
                <h3 className="font-serif text-xl text-charcoal mb-4">
                  {value.title}
                </h3>
                <p className="text-slate leading-relaxed text-sm">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 lg:py-40 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
              Work With Us
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight mb-10">
              Let&apos;s Build Something
              <br />
              Together
            </h2>
            <p className="text-slate text-lg leading-relaxed max-w-2xl mx-auto mb-16">
              We welcome the opportunity to discuss how our expertise
              can serve your investment objectives.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-10 py-4 bg-red text-white text-sm tracking-wide hover:bg-red-dark transition-colors group"
            >
              Get in Touch
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
