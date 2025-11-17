import React from "react";
import Logo from "../Logo";

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-12 pb-6 px-4 border-t border-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo & Description */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Logo size="sm" />
          </div>
          <p className="text-gray-400 mb-4 text-sm leading-relaxed">
            Professional laundry, ironing, and alteration services with free pickup and delivery across India.
          </p>
          <div className="flex gap-4 mt-2">
            <a href="#" aria-label="Facebook" className="hover:text-primary-400 transition"><i className="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Twitter" className="hover:text-primary-400 transition"><i className="fab fa-twitter"></i></a>
            <a href="#" aria-label="Instagram" className="hover:text-primary-400 transition"><i className="fab fa-instagram"></i></a>
          </div>
        </div>
        {/* Services */}
        <div>
          <h4 className="font-semibold mb-3 text-lg">Services</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>Washing & Cleaning</li>
            <li>Ironing & Pressing</li>
            <li>Alterations & Repairs</li>
            <li>Express Service</li>
          </ul>
        </div>
        {/* Company */}
        <div>
          <h4 className="font-semibold mb-3 text-lg">Company</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>About Us</li>
            <li>How It Works</li>
            <li>Pricing</li>
            <li>Careers</li>
          </ul>
        </div>
        {/* Contact */}
        <div>
          <h4 className="font-semibold mb-3 text-lg">Contact</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li><span className="mr-2">📞</span>+91 98765 43210</li>
            <li><span className="mr-2">✉️</span>hello@rewash.in</li>
            <li><span className="mr-2">📍</span>Delhi, India</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between text-gray-500 text-xs gap-2">
        <div>
          © 2024 REWASH. All rights reserved. | <a href="#" className="hover:text-primary-400 underline">Privacy Policy</a> | <a href="#" className="hover:text-primary-400 underline">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}


