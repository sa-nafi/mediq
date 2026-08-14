import { Link } from 'react-router-dom';
import { Globe, MessageCircle, Camera, Briefcase, Play, Phone, Mail, MapPin } from 'lucide-react';
import logoSrc from '@/assets/logo.png';

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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <address className="flex items-center gap-6 flex-wrap justify-center not-italic">
              <a
                href="tel:+8801712341234"
                className="flex items-center gap-2 text-sm text-white/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200"
                aria-label="Call us at +8801712341234"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span>+8801712341234</span>
              </a>
              <a
                href="mailto:info@noorhealthcare.com"
                className="flex items-center gap-2 text-sm text-white/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200"
                aria-label="Email us at info@noorhealthcare.com"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>info@noorhealthcare.com</span>
              </a>
            </address>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
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
            <Link 
              to="/" 
              className="flex items-center gap-2.5 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md w-fit" 
              aria-label="Noor Healthcare Home"
            >
              <img src={logoSrc} alt="" className="h-10 w-10 object-contain" aria-hidden="true" />
              <span className="text-2xl font-bold tracking-tight">
                Noor <span className="text-accent">Healthcare</span>
              </span>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs mb-8">
              Leading healthcare provider committed to excellence in medical treatment and compassionate care.
            </p>
            <div className="flex items-center gap-3" aria-label="Social media links">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white/80 hover:bg-accent hover:text-primary hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-300"
                >
                  <social.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 relative z-10 lg:col-span-4 mt-8 lg:mt-0">
            {/* Corporate */}
            <nav aria-label="Corporate Links">
              <h3 className="text-white font-semibold mb-6 text-lg tracking-wide">Corporate</h3>
              <ul className="space-y-3.5">
                <li><Link to="/about" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">About Noor Healthcare</Link></li>
                <li><Link to="/contact" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Contact US</Link></li>
                <li><Link to="/news" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">News & Events</Link></li>
                <li><Link to="/careers" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Careers</Link></li>
              </ul>
            </nav>

            {/* Speciality */}
            <nav aria-label="Speciality Links">
              <h3 className="text-white font-semibold mb-6 text-lg tracking-wide">Speciality</h3>
              <ul className="space-y-3.5">
                <li><Link to="/doctors" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Cardiac Care</Link></li>
                <li><Link to="/doctors" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Dentistry</Link></li>
                <li><Link to="/doctors" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Gastrosciences</Link></li>
                <li><Link to="/doctors" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Neuroscience</Link></li>
                <li><Link to="/doctors" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Orthopaedics</Link></li>
                <li><Link to="/doctors" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">More Specialities</Link></li>
              </ul>
            </nav>

            {/* Medical Services */}
            <nav aria-label="Medical Service Links">
              <h3 className="text-white font-semibold mb-6 text-lg tracking-wide">Medical Services</h3>
              <ul className="space-y-3.5">
                <li><Link to="/doctors" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Find a Doctor</Link></li>
                <li><Link to="/login" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Book Appointment</Link></li>
                <li><Link to="/health-library" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Health Library</Link></li>
                <li><Link to="/services" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Consultancy</Link></li>
                <li><Link to="/services" className="text-sm text-white/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 inline-block">Medical Tests</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <p>&copy; {new Date().getFullYear()} Noor Healthcare. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm">Privacy Policy</a>
              <span>|</span>
              <a href="#" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
