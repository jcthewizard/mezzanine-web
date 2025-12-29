"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-border p-12 text-center"
      >
        <CheckCircle size={40} strokeWidth={1.5} className="text-red mx-auto mb-6" />
        <h3 className="font-serif text-2xl text-charcoal mb-4">
          Thank You
        </h3>
        <p className="text-slate">
          We&apos;ve received your message and will respond shortly.
        </p>
      </motion.div>
    );
  }

  const inputClasses = "w-full px-0 py-4 bg-transparent border-0 border-b border-border focus:border-red focus:ring-0 outline-none transition-colors text-charcoal placeholder:text-slate-light";
  const labelClasses = "block text-xs tracking-wider text-slate-light uppercase mb-1";

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      onSubmit={handleSubmit}
      className="bg-white border border-border p-8 lg:p-12"
    >
      <div className="space-y-8">
        {/* Name Fields */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="firstName" className={labelClasses}>
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              className={inputClasses}
              placeholder="John"
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClasses}>
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              className={inputClasses}
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className={labelClasses}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className={inputClasses}
            placeholder="john@example.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className={labelClasses}>
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className={inputClasses}
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className={labelClasses}>
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            required
            className={`${inputClasses} cursor-pointer`}
          >
            <option value="">Select a topic</option>
            <option value="investment">Investment Opportunities</option>
            <option value="asset-management">Asset Management</option>
            <option value="partnership">Partnership Inquiry</option>
            <option value="general">General Inquiry</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className={labelClasses}>
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={4}
            className={`${inputClasses} resize-none`}
            placeholder="Tell us about your investment goals..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red text-white px-8 py-4 text-sm tracking-wide hover:bg-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </div>
    </motion.form>
  );
}
