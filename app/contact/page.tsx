"use client";

import { motion } from "framer-motion";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <>
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2074&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/60 to-charcoal/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-32 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl"
          >
            <p className="text-red text-sm tracking-[0.3em] uppercase mb-8">
              Contact
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-[1.15] mb-8">
              Let&apos;s Start a
              <br />
              Conversation
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-xl leading-relaxed">
              We welcome inquiries from investors, partners, and those
              seeking strategic real estate counsel.
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
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
