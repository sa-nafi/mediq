import { Link } from 'react-router-dom';
import { Globe, MessageCircle, Camera, Briefcase, Play, Phone, Mail, MapPin } from 'lucide-react';
import logoSrc from '@/assets/logo.png';

const footerSections = [
  {
    title: 'Corporate',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#' },
      { label: 'News & Updates', href: '#' },
      { label: 'Contact Us', href: '#' },
    ],
  },
  {
    title: 'Diagnostic Services',
    links: [
      { label: 'Blood Tests', href: '/services' },
      { label: 'Imaging & Radiology', href: '/services' },
      { label: 'Health Checkups', href: '/tests' },
      { label: 'Cardiac Diagnostics', href: '/services' },
      { label: 'Pathology', href: '/services' },
    ],
  },
  {
    title: 'Patient Resources',
    links: [
      { label: 'Patient Portal', href: '/patient' },
      { label: 'Book Appointment', href: '#' },
      { label: 'Download Reports', href: '#' },
      { label: 'Health Articles', href: '#resources' },
      { label: 'FAQs', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Refund Policy', href: '#' },
    ],
  },
] as const;

const socialLinks = [
  { icon: Globe, label: 'Website', href: '#' },
  { icon: MessageCircle, label: 'Twitter', href: '#' },
  { icon: Camera, label: 'Instagram', href: '#' },
  { icon: Briefcase, label: 'LinkedIn', href: '#' },
  { icon: Play, label: 'YouTube', href: '#' },
] as const;

export function Footer() {
  return (
    <footer className="bg-primary text-white" role="contentinfo">
      {/* Contact Bar */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <a
                href="tel:+880XXXXXXXXXX"
                className="flex items-center gap-2 text-sm text-white/80 hover:text-accent transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>+880-XXX-XXXXXXX</span>
              </a>
              <a
                href="mailto:info@mediq.example"
                className="flex items-center gap-2 text-sm text-white/80 hover:text-accent transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>info@mediq.example</span>
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Demo Address, Dhaka, Bangladesh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4" aria-label="MediQ Home">
              <img src={logoSrc} alt="" className="h-10 w-10 object-contain" />
              <span className="text-2xl font-bold">
                Medi<span className="text-accent">Q</span>
              </span>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs mb-6">
              MediQ Diagnostic Center is committed to providing accurate, reliable diagnostic services with modern technology and compassionate care.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white/80 hover:bg-accent hover:text-primary transition-all duration-200"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/90 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/60 hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>&copy; {new Date().getFullYear()} MediQ Diagnostic Center. All rights reserved.</p>
            <p>Demo project — not a real medical facility.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
