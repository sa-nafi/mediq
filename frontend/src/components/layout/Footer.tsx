import { Link } from 'react-router-dom';
import { Globe, MessageCircle, Camera, Briefcase, Play, Phone, Mail, MapPin } from 'lucide-react';
import logoSrc from '@/assets/logo.png';

import { useAppointmentStore } from '@/store/appointment-store';
const socialLinks = [
  { icon: Globe, label: 'Website', href: '#' },
  { icon: MessageCircle, label: 'Twitter', href: '#' },
  { icon: Camera, label: 'Instagram', href: '#' },
  { icon: Briefcase, label: 'LinkedIn', href: '#' },
  { icon: Play, label: 'YouTube', href: '#' },
] as const;

export function Footer() {
  const openModal = useAppointmentStore((s) => s.openModal);

  return (
    <footer className="bg-primary text-white" role="contentinfo">
      {/* Contact Bar */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <a
                href="tel:+8801712341234"
                className="flex items-center gap-2 text-sm text-white/80 hover:text-accent transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>+8801712341234</span>
              </a>
              <a
                href="mailto:info@noorhealthcare.com"
                className="flex items-center gap-2 text-sm text-white/80 hover:text-accent transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>info@noorhealthcare.com</span>
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Dhaka, Bangladesh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4" aria-label="Noor Healthcare Home">
              <img src={logoSrc} alt="" className="h-10 w-10 object-contain" />
              <span className="text-2xl font-bold">
                Noor <span className="text-accent">Healthcare</span>
              </span>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs mb-6">
              Leading healthcare provider committed to excellence in medical treatment and compassionate care.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 relative z-10 lg:col-span-4">
            {/* Corporate */}
            <div>
              <h3 className="text-white font-bold mb-6 text-lg">Corporate</h3>
              <ul className="space-y-4">
                <li><Link to="/about" className="hover:text-white transition-colors">About Noor Healthcare</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact US</Link></li>
                <li><Link to="/news" className="hover:text-white transition-colors">News & Events</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>

            {/* Speciality */}
            <div>
              <h3 className="text-white font-bold mb-6 text-lg">Speciality</h3>
              <ul className="space-y-4">
                <li><Link to="/doctors" className="hover:text-white transition-colors">Cardiac Care</Link></li>
                <li><Link to="/doctors" className="hover:text-white transition-colors">Dentistry</Link></li>
                <li><Link to="/doctors" className="hover:text-white transition-colors">Gastrosciences</Link></li>
                <li><Link to="/doctors" className="hover:text-white transition-colors">Neuroscience</Link></li>
                <li><Link to="/doctors" className="hover:text-white transition-colors">Orthopaedics</Link></li>
                <li><Link to="/doctors" className="hover:text-white transition-colors">More Specialities</Link></li>
              </ul>
            </div>

            {/* Medical Services */}
            <div>
              <h3 className="text-white font-bold mb-6 text-lg">Medical Services</h3>
              <ul className="space-y-4">
                <li><Link to="/doctors" className="hover:text-white transition-colors">Find a Doctor</Link></li>
                <li><button onClick={openModal} className="hover:text-white transition-colors text-left w-full">Book Appointment</button></li>
                <li><Link to="/health-library" className="hover:text-white transition-colors">Health Library</Link></li>
                <li><Link to="/services" className="hover:text-white transition-colors">Consultancy</Link></li>
                <li><Link to="/services" className="hover:text-white transition-colors">Medical Tests</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>&copy; {new Date().getFullYear()} Noor Healthcare. All rights reserved.</p>
            <p>Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
