'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const isSharePage = pathname === '/lab/share';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Songs', icon: '🎵' },
    { href: '/bible', label: 'Bible', icon: '📖' },
    { href: '/lab', label: 'Music Lab', icon: '🎛️' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const renderNavItem = (item: typeof navItems[0], isMobile = false) => {
    const isActive = pathname === item.href || (isSharePage && item.href === '/lab');
    const baseClasses = `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isMobile ? 'block w-full text-left' : ''
    }`;
    
    if (isSharePage) {
      // Render as disabled div for share page
      return (
        <div
          key={item.href}
          className={`${baseClasses} cursor-not-allowed pointer-events-none ${
            isActive
              ? 'bg-gray-200 text-gray-500'
              : 'text-gray-400'
          }`}
        >
          <span className="mr-2 opacity-50">{item.icon}</span>
          <span className="opacity-50">{item.label}</span>
        </div>
      );
    }
    
    // Normal active link for non-share pages
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${baseClasses} ${
          isActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <span className="mr-2">{item.icon}</span>
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className={`text-xl font-bold ${isSharePage ? 'text-gray-400' : 'text-gray-900'}`}>
              Pro Writing Tools
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => renderNavItem(item))}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md transition-colors ${
                isSharePage 
                  ? 'text-gray-400 cursor-not-allowed pointer-events-none' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              disabled={isSharePage}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-200">
            {navItems.map((item) => renderNavItem(item, true))}
          </div>
        )}
      </div>
    </nav>
  );
}