"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-cream overflow-hidden">

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {/* Eyebrow */}
            <p className="text-red text-sm tracking-[0.3em] uppercase mb-8">
              Commercial Real Estate & Asset Management
            </p>

            {/* Main Heading */}
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-charcoal leading-[1.1] mb-8">
              Building Wealth
              <br />
              Through Strategic
              <br />
              Investment
            </h1>

            {/* Subheading */}
            <p className="text-slate text-lg md:text-xl max-w-xl leading-relaxed mb-12">
              We provide comprehensive advice, execution, and asset management
              services to discerning investors and institutions.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-red text-white text-sm tracking-wide hover:bg-red-dark transition-colors"
              >
                Start a Conversation
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-4 border border-charcoal/20 text-charcoal text-sm tracking-wide hover:border-charcoal/40 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-12 left-6 lg:left-12">
          <div className="flex items-center gap-3 text-slate-light text-sm tracking-wider">
            <div className="w-12 h-px bg-slate-light" />
            <span>Bellevue, Washington</span>
          </div>
        </div>
      </div>

      {/* Right side decorative - logo icon */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute right-12 lg:right-24 top-1/2 -translate-y-1/2 hidden lg:block"
      >
        <Image
          src="/icon.png"
          alt=""
          width={300}
          height={300}
          className="w-64 h-64"
        />
      </motion.div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </section>
  );
}
