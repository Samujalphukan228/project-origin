'use client';

import { useState } from 'react';
import {
    Mail,
    Phone,
    MessageCircle,
    HelpCircle,
    Search,
    ChevronRight,
    Send,
    CheckCircle,
    Clock,
    Book,
    FileText,
    Video,
    Headphones,
    Globe,
    MessageSquare,
    X,
    Loader2,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    AlertCircle,
} from 'lucide-react';

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [showContactForm, setShowContactForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showToast('Message sent successfully! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setShowContactForm(false);
        setIsSubmitting(false);
    };

    const filteredFaqs = searchQuery
        ? faqs.filter(
              (faq) =>
                  faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : faqs;

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-2">
                        Help & Support
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Get the help you need, whenever you need it
                    </p>
                </div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Email Support */}
                    <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] rounded-xl p-6 transition-all duration-200 group">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-black dark:text-white mb-1">
                                    Email Support
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Send us an email anytime and we'll respond within 24 hours
                                </p>
                                <a
                                    href="mailto:contact@nexxupp.com"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                >
                                    contact@nexxupp.com
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Website */}
                    <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] rounded-xl p-6 transition-all duration-200 group">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                                <Globe className="w-6 h-6 text-green-600 dark:text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-black dark:text-white mb-1">
                                    Visit Our Website
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Learn more about our services and solutions
                                </p>
                                <a
                                    href="https://nexxupp.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                                >
                                    nexxupp.com
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support Categories */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                        Browse by Category
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {supportCategories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className="p-4 bg-gray-50 dark:bg-[#111] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] rounded-xl transition-all duration-200 text-left group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                                        <category.icon className="w-5 h-5" />
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                                <h3 className="font-semibold text-sm text-black dark:text-white mb-1">
                                    {category.title}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {category.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search FAQs */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search frequently asked questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-12 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] focus:border-black dark:focus:border-white rounded-xl text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-all duration-200"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-[#111]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* FAQs */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-[#222]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-black dark:text-white">
                                Frequently Asked Questions
                            </h2>
                            {searchQuery && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-[#222]">
                        {filteredFaqs.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <HelpCircle className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                                </div>
                                <p className="text-sm font-medium text-black dark:text-white mb-1">
                                    No FAQs found
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Try searching with different keywords
                                </p>
                            </div>
                        ) : (
                            filteredFaqs.map((faq) => (
                                <FaqItem
                                    key={faq.id}
                                    faq={faq}
                                    isExpanded={expandedFaq === faq.id}
                                    onToggle={() =>
                                        setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Contact Form */}
                    <button
                        onClick={() => setShowContactForm(true)}
                        className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] rounded-xl p-6 transition-all duration-200 text-left group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
                        </div>
                        <h3 className="text-base font-semibold text-black dark:text-white mb-2">
                            Send us a message
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Fill out our contact form and we'll respond within 24 hours
                        </p>
                    </button>

                    {/* Response Time */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-500/5 dark:to-purple-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-white dark:bg-black border border-blue-200 dark:border-blue-500/30 rounded-xl flex items-center justify-center shadow-sm">
                                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                            </div>
                        </div>
                        <h3 className="text-base font-semibold text-black dark:text-white mb-2">
                            Average Response Time
                        </h3>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-2">
                            &lt; 2 hours
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Our support team is here to help you quickly
                        </p>
                    </div>
                </div>

                {/* Support Hours */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            Support Hours
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-black dark:text-white mb-1">
                                    Email Support
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Available 24/7 for all inquiries
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-black dark:text-white mb-1">
                                    General Support
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Monday - Friday, 9:00 AM - 6:00 PM EST
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Form Modal */}
            {showContactForm && (
                <ContactFormModal
                    formData={formData}
                    setFormData={setFormData}
                    onClose={() => setShowContactForm(false)}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}

// FAQ Item Component
function FaqItem({ faq, isExpanded, onToggle }) {
    return (
        <div className="px-6 py-5 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors duration-200">
            <button
                onClick={onToggle}
                className="w-full flex items-start justify-between gap-4 text-left group"
            >
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors leading-relaxed">
                        {faq.question}
                    </h3>
                </div>
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                </div>
            </button>
            {isExpanded && (
                <div className="mt-3 pl-0 animate-in slide-in-from-top-1 fade-in duration-200">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {faq.answer}
                    </p>
                </div>
            )}
        </div>
    );
}

// Contact Form Modal
function ContactFormModal({ formData, setFormData, onClose, onSubmit, isSubmitting }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#0a0a0a] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[95vh] overflow-hidden border-t sm:border border-gray-200 dark:border-[#222] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle - Mobile */}
                <div className="sm:hidden pt-3 pb-2 flex-shrink-0">
                    <div className="w-12 h-1 bg-gray-300 dark:bg-[#333] rounded-full mx-auto" />
                </div>

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-[#222] flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-black dark:text-white mb-1">
                                Contact Support
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                We'll get back to you within 24 hours
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#111] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full h-11 px-4 bg-white dark:bg-black border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] focus:border-black dark:focus:border-white rounded-lg text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-all duration-200"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full h-11 px-4 bg-white dark:bg-black border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] focus:border-black dark:focus:border-white rounded-lg text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-all duration-200"
                                placeholder="john@example.com"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                className="w-full h-11 px-4 bg-white dark:bg-black border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] focus:border-black dark:focus:border-white rounded-lg text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-all duration-200"
                                placeholder="How can we help you?"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={6}
                                className="w-full px-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] focus:border-black dark:focus:border-white rounded-lg text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-all duration-200 resize-none"
                                placeholder="Please describe your issue or question in detail..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                            <div className="flex gap-3">
                                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                                        Prefer email?
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                        You can also reach us directly at{' '}
                                        <a
                                            href="mailto:contact@nexxupp.com"
                                            className="font-semibold underline hover:no-underline"
                                        >
                                            contact@nexxupp.com
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-[#222] bg-gray-50 dark:bg-[#111] flex gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 h-11 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] bg-white dark:bg-black text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-11 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Toast Component
function Toast({ message, type, onClose }) {
    return (
        <div className="fixed bottom-24 lg:bottom-8 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                type === 'success'
                                    ? 'bg-green-50 dark:bg-green-500/10'
                                    : 'bg-red-50 dark:bg-red-500/10'
                            }`}
                        >
                            {type === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black dark:text-white leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#111] rounded-lg transition-colors shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Data
const supportCategories = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        description: 'Learn the basics and setup',
        icon: Book,
        color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500',
    },
    {
        id: 'documentation',
        title: 'Documentation',
        description: 'Browse our detailed guides',
        icon: FileText,
        color: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500',
    },
    {
        id: 'video-tutorials',
        title: 'Video Tutorials',
        description: 'Watch step-by-step guides',
        icon: Video,
        color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500',
    },
    {
        id: 'contact',
        title: 'Contact Support',
        description: 'Get personalized assistance',
        icon: Headphones,
        color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500',
    },
];

const faqs = [
    {
        id: 1,
        question: 'How do I reset my password?',
        answer: 'To reset your password, click on the "Forgot Password" link on the login page. You will receive an email with instructions to create a new password. If you don\'t receive the email, please check your spam folder or contact support at contact@nexxupp.com.',
    },
    {
        id: 2,
        question: 'How can I add new menu items?',
        answer: 'Navigate to the Menu page from the sidebar, click the "Add Item" button, fill in the required information including name, description, price, and upload images. Once submitted, the item will be pending approval from the admin.',
    },
    {
        id: 3,
        question: 'What payment methods are supported?',
        answer: 'We support all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets like Apple Pay and Google Pay. All transactions are secured with industry-standard encryption.',
    },
    {
        id: 4,
        question: 'How do I track my orders?',
        answer: 'You can track all orders in real-time from the Orders dashboard. Each order shows its current status (Pending, Preparing, Delivered, etc.) and you\'ll receive notifications for status updates.',
    },
    {
        id: 5,
        question: 'Can I customize the restaurant dashboard?',
        answer: 'Yes! You can customize various aspects of your dashboard including notification preferences, display settings, and data filters. Go to Settings to configure your preferences.',
    },
    {
        id: 6,
        question: 'How do I manage employee accounts?',
        answer: 'From the Employees section, you can view all staff members, approve new registrations, update roles, and manage permissions. Only admin users have access to employee management features.',
    },
    {
        id: 7,
        question: 'What are the system requirements?',
        answer: 'Our platform works on all modern web browsers (Chrome, Firefox, Safari, Edge). For the best experience, we recommend using the latest version of your browser. Mobile apps are also available for iOS and Android.',
    },
    {
        id: 8,
        question: 'How do I contact support?',
        answer: 'You can reach us via email at contact@nexxupp.com and we aim to respond within 24 hours. You can also use the contact form on this page to send us a detailed message about your inquiry.',
    },
];