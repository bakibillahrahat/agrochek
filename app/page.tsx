import Navbar from "@/components/home/Navbar";
import Image from "next/image";
import Link from "next/link";
import { Droplet, TestTube, Leaf, Thermometer } from "lucide-react";
import GetReportSection from "@/components/home/GetReportSection"; // Added import

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to{" "}
              <span className="text-green-600">AgriCheck</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Your comprehensive solution for agricultural monitoring and management. Get real-time insights and make data-driven decisions for your farm.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-lg"
              >
                Get Started
              </Link>
              <Link
                href="/auth/sign-in"
                className="px-8 py-3 border border-gray-200 text-gray-900 rounded-md hover:bg-gray-50 transition-colors duration-200 text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-50 py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Comprehensive Agricultural Testing
              </h2>
              <p className="text-gray-600 text-lg">
                Advanced testing solutions for optimal farm management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-lg border border-gray-200 hover:border-green-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <TestTube className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Soil Analysis</h3>
                </div>
                <p className="text-gray-600">
                  Comprehensive soil testing for pH, nutrients, and composition
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-200 hover:border-green-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Droplet className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Water Quality</h3>
                </div>
                <p className="text-gray-600">
                  Detailed water testing for irrigation and crop health
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-200 hover:border-green-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Fertilizer Testing</h3>
                </div>
                <p className="text-gray-600">
                  Analysis of fertilizer composition and effectiveness
                </p>
              </div>

              <div className="bg-white p-8 rounded-lg border border-gray-200 hover:border-green-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Thermometer className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Environmental Monitoring</h3>
                </div>
                <p className="text-gray-600">
                  Track temperature, humidity, and environmental conditions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Get Report Section (New) */}
        <GetReportSection />

        {/* Stats Section */}
        <div className="bg-green-600 py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <h3 className="text-4xl font-bold text-white mb-2">500+</h3>
                <p className="text-green-100">Active Farms</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold text-white mb-2">98%</h3>
                <p className="text-green-100">Customer Satisfaction</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold text-white mb-2">24/7</h3>
                <p className="text-green-100">Support Available</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold text-white mb-2">50K+</h3>
                <p className="text-green-100">Acres Monitored</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-green-600 mb-2">TESTIMONIALS</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                কৃষকদের মতামত
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                আমরা আপনাকে সেরাটা দিতে চাই। এবং তার জন্য আপনার প্রয়োজন বিশ্বাস। কৃষকরা আমাদের সম্পর্কে কি বলে তা আপনি দেখতে পারেন এবং আপনার সিদ্ধান্ত নিতে পারেন।
              </p>
            </div>
            <div className="flex space-x-6 overflow-x-auto pb-6 hide-scrollbar">
              {/* Testimonial Card 1 */}
              <div className="flex-shrink-0 w-80 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-800 mb-4 leading-relaxed">
                  <span className="block mb-2">"এগ্রিচেক আমাদের খামার ব্যবস্থাপনায় বিপ্লব এনেছে। এই অন্তর্দৃষ্টিগুলি অমূল্য।"</span>
                  <span className="text-sm text-gray-500 italic">"AgriCheck has transformed how we manage our farm. The insights are invaluable."</span>
                </p>
                <p className="font-medium text-gray-900">জন স্মিথ, গম চাষী</p>
              </div>

              {/* Testimonial Card 2 */}
              <div className="flex-shrink-0 w-80 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-800 mb-4 leading-relaxed">
                  <span className="block mb-2">"আবহাওয়া সংযোগের বৈশিষ্ট্যটি আমাদের বীজ বপন এবং ফসলের ফলন অনুকূল করতে সাহায্য করেছে।"</span>
                  <span className="text-sm text-gray-500 italic">"The weather integration feature has helped us make better planting decisions."</span>
                </p>
                <p className="font-medium text-gray-900">সারা জনসন, জৈব কৃষক</p>
              </div>

              {/* Testimonial Card 3 */}
              <div className="flex-shrink-0 w-80 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-800 mb-4 leading-relaxed">
                  <span className="block mb-2">"গ্রাহক সেবা অসাধারণ। আমাদের যখনই প্রয়োজন হয়, তারা সবসময় উপস্থিত থাকে।"</span>
                  <span className="text-sm text-gray-500 italic">"Customer support is exceptional. They're always there when we need them."</span>
                </p>
                <p className="font-medium text-gray-900">মাইক ব্রাউন, দুগ্ধ খামারি</p>
              </div>

               {/* Add more testimonial cards as needed */}
            </div>

            {/* Not Sure Yet Section */}
            <div className="text-center mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">নিশ্চিত নন এখনও?</h3>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                চিন্তা করবেন না, আমরা বুঝতে পারছি এবং আপনার সমস্ত সন্দেহ দূর করার জন্য আমরা আমাদের সেরাটা দেব।
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/faq"
                  className="px-8 py-3 border border-gray-200 text-gray-900 rounded-md hover:bg-gray-100 transition-colors duration-200 text-lg"
                >
                  আমাদের FAQ দেখুন
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-lg"
                >
                  একটি অ্যাপয়েন্টমেন্ট নির্ধারণ করুন
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">AgriCheck</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Empowering farmers with smart technology for better agriculture. Making farming more efficient and sustainable.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">About Us</Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">Services</Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">Pricing</Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">Blog</Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">Contact</Link>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Services</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">Soil Analysis</Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">Water Quality Testing</Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">Fertilizer Testing</Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">Environmental Monitoring</Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">Agricultural Consulting</Link>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <svg className="h-6 w-6 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">support@agricheck.com</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="h-6 w-6 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-600">+1 (555) 123-4567</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <svg className="h-6 w-6 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">123 Farm Street, Agriculture City, AC 12345</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <p className="text-gray-600 text-sm">
                  &copy; {new Date().getFullYear()} AgriCheck. All rights reserved.
                </p>
                <div className="flex space-x-6">
                  <Link href="/privacy" className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="text-gray-600 hover:text-green-600 text-sm transition-colors">
                    Cookie Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
