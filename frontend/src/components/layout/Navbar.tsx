import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAppointmentStore } from '@/store/appointment-store';
import { cn } from '@/lib/utils';
import logoSrc from '@/assets/logo.png';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Tests & Packages', href: '/tests' },
  { label: 'About Us', href: '#about' },
  { label: 'Health Resources', href: '#resources' },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const openModal = useAppointmentStore((s) => s.openModal);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-soft'
          : 'bg-transparent',
      )}
    >
      <nav
        className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="MediQ Home">
          <img src={logoSrc} alt="MediQ Logo" className="h-9 w-9 object-contain" />
          <span className="text-xl font-bold text-primary hidden sm:inline">
            Medi<span className="text-secondary">Q</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    isActive
                      ? 'text-secondary bg-secondary/10'
                      : 'text-foreground/80 hover:text-secondary hover:bg-secondary/5',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop Right */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-muted hover:text-foreground transition-colors"
            aria-label="Change language"
          >
            <Globe className="h-4 w-4" />
            <span>EN</span>
          </button>
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Button variant="accent" size="default" onClick={openModal}>
            Book Appointment
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button variant="accent" size="sm" onClick={openModal} className="hidden sm:inline-flex">
            Book Now
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" hideTitle>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <img src={logoSrc} alt="" className="h-8 w-8" />
                  <span className="text-lg font-bold text-primary">
                    Medi<span className="text-secondary">Q</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-6 mt-4">
                <AnimatePresence>
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => handleNavClick(link.href)}
                        className="block px-4 py-3 rounded-xl text-base font-medium text-foreground/80 hover:text-secondary hover:bg-secondary/5 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <hr className="my-4 border-border-light" />
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Button
                  variant="accent"
                  className="w-full mt-2"
                  onClick={() => {
                    setMobileOpen(false);
                    openModal();
                  }}
                >
                  Book Appointment
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
