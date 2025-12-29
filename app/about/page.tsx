"use client";

import Link from "next/link";
import Image from "next/image";
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
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 lg:pt-48 lg:pb-40 bg-cream overflow-hidden">

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="max-w-3xl"
          >
            <p className="text-red text-sm tracking-[0.3em] uppercase mb-8">
              About Us
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-charcoal leading-[1.1] mb-8">
              Decades of
              <br />
              Excellence
            </h1>
            <p className="text-slate text-lg md:text-xl max-w-xl leading-relaxed">
              A trusted partner in commercial real estate investment
              and asset management since our founding.
            </p>
          </motion.div>
        </div>

        {/* Decorative - logo icon */}
        <div className="absolute right-12 lg:right-24 top-1/2 -translate-y-1/2 hidden lg:block">
          <Image
            src="/icon.png"
            alt=""
            width={200}
            height={200}
            className="w-48 h-48"
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      </section>

      {/* Story Section */}
      <section className="py-32 lg:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left - Visual */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-cream relative">
                {/* Decorative frame */}
                <div className="absolute inset-8 border border-border" />

                {/* Quote */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-white">
                  <p className="font-serif text-xl text-charcoal italic leading-relaxed">
                    &ldquo;We believe in creating lasting value through
                    strategic vision and disciplined execution.&rdquo;
                  </p>
                  <div className="mt-6 w-8 h-px bg-red" />
                </div>
              </div>
            </motion.div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:py-12"
            >
              <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
                Our Story
              </p>
              <h2 className="font-serif text-4xl text-charcoal leading-tight mb-8">
                A Legacy of
                <br />
                Trusted Counsel
              </h2>
              <div className="w-12 h-px bg-red mb-8" />

              <div className="space-y-6 text-slate leading-relaxed">
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
        </div>
      </section>

      {/* Values Section */}
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
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
              Work With Us
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight mb-8">
              Let&apos;s Build Something
              <br />
              Together
            </h2>
            <p className="text-slate text-lg max-w-xl mx-auto mb-12">
              We welcome the opportunity to discuss how our expertise
              can serve your investment objectives.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-10 py-4 bg-red text-white font-serif text-sm tracking-wide hover:bg-red-dark transition-colors group"
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
