"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
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
              Contact
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-charcoal leading-[1.1] mb-8">
              Let&apos;s Start a
              <br />
              Conversation
            </h1>
            <p className="text-slate text-lg md:text-xl max-w-xl leading-relaxed">
              We welcome inquiries from investors, partners, and those
              seeking strategic real estate counsel.
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

      {/* Contact Section */}
      <section className="py-32 lg:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left - Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-red text-sm tracking-[0.2em] uppercase mb-6">
                Get in Touch
              </p>
              <h2 className="font-serif text-4xl text-charcoal leading-tight mb-8">
                We&apos;d Be Pleased
                <br />
                to Hear From You
              </h2>
              <div className="w-12 h-px bg-red mb-12" />

              <p className="text-slate leading-relaxed mb-12 max-w-md">
                Whether you&apos;re exploring investment opportunities, seeking asset
                management services, or simply want to learn more, we&apos;re here to help.
              </p>

              {/* Contact Details */}
              <div className="space-y-8">
                <div>
                  <p className="text-xs tracking-wider text-slate-light uppercase mb-2">
                    Address
                  </p>
                  <p className="text-charcoal">
                    11245 SE 6th Street, Suite 280
                    <br />
                    Bellevue, WA 98004
                  </p>
                </div>

                <div>
                  <p className="text-xs tracking-wider text-slate-light uppercase mb-2">
                    Phone
                  </p>
                  <a
                    href="tel:8882622835"
                    className="text-charcoal hover:text-red transition-colors"
                  >
                    888.262.2835
                  </a>
                </div>

                <div>
                  <p className="text-xs tracking-wider text-slate-light uppercase mb-2">
                    Email
                  </p>
                  <a
                    href="mailto:contact@mezzinc.com"
                    className="text-charcoal hover:text-red transition-colors"
                  >
                    contact@mezzinc.com
                  </a>
                </div>

                <div>
                  <p className="text-xs tracking-wider text-slate-light uppercase mb-2">
                    Hours
                  </p>
                  <p className="text-charcoal">
                    Monday – Friday
                    <br />
                    9:00 AM – 5:00 PM PST
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right - Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="h-80 bg-cream relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-serif text-2xl text-charcoal mb-2">
              Bellevue, Washington
            </p>
            <p className="text-slate text-sm">
              11245 SE 6th Street, Suite 280
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-red/30" />
      </section>
    </>
  );
}
