import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-5">
            <img
              src="/icon.png"
              alt="Mezzanine Properties, Inc."
              className="h-16 w-16 mb-8"
            />
            <p className="text-white/50 leading-relaxed max-w-sm">
              Comprehensive real estate investment and asset management
              services for discerning investors and institutions.
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2 lg:col-start-7">
            <h4 className="text-sm tracking-wider text-white/30 uppercase mb-6">
              Navigation
            </h4>
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/70 hover:text-red transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-4">
            <h4 className="text-sm tracking-wider text-white/30 uppercase mb-6">
              Contact
            </h4>
            <div className="space-y-4 text-white/70 text-sm">
              <p>
                11245 SE 6th Street, Suite 280
                <br />
                Bellevue, WA 98004
              </p>
              <p>
                <a
                  href="tel:8882622835"
                  className="hover:text-red transition-colors"
                >
                  888.262.2835
                </a>
              </p>
              <p>
                <a
                  href="mailto:contact@mezzinc.com"
                  className="hover:text-red transition-colors"
                >
                  contact@mezzinc.com
                </a>
              </p>
              <p className="text-white/40">
                Monday – Friday, 9am – 5pm PST
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-sm">
              © {currentYear} Mezzanine Properties, Inc. All rights reserved.
            </p>
            <div className="w-8 h-px bg-red/50" />
          </div>
        </div>
      </div>
    </footer>
  );
}
