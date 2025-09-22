/**
 * Example usage of the BusinessInfoHeader component
 * This demonstrates how to use the component with sample business data
 */

import React from 'react';
import BusinessInfoHeader from '@/components/BusinessInfoHeader';

// Example business data
const sampleBusinessData = {
  name: "XenlixAI Digital Solutions",
  website: "https://xenlix.ai",
  address: "123 Tech Boulevard, Innovation District, Dallas, TX 75201",
  phone: "+1 (555) 123-4567",
  socials: {
    twitter: "https://twitter.com/xenlix",
    linkedin: "https://linkedin.com/company/xenlix",
    facebook: "https://facebook.com/xenlix",
    instagram: "https://instagram.com/xenlix",
    youtube: "https://youtube.com/@xenlix"
  },
  mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3355.0179875932315!2d-96.79666908488439!3d32.77664598097913!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864e991817d00bc7%3A0x2e9e8b8e8e8e8e8e!2sDallas%2C%20TX!5e0!3m2!1sen!2sus!4v1637123456789!5m2!1sen!2sus"
};

// Example with minimal data
const minimalBusinessData = {
  name: "Local Consulting Firm",
  website: "https://localconsulting.com",
  address: "456 Main Street, Anytown, USA",
  phone: "+1 (555) 987-6543",
  socials: {
    linkedin: "https://linkedin.com/company/localconsulting"
  },
  mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.0123456789!2d-74.005974!3d40.712776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDBCMDQnNTguMCJOIDc0wrAwMCczNS4xIlc!5e0!3m2!1sen!2sus!4v1637123456789!5m2!1sen!2sus"
};

// Example page component using BusinessInfoHeader
const ExampleBusinessPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Full-featured business header */}
      <BusinessInfoHeader businessData={sampleBusinessData} />
      
      {/* Page content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">
          About Our Services
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed mb-6">
          Welcome to our business page. The header above displays all our key contact 
          information, social media links, and an interactive map showing our location.
        </p>
        <p className="text-lg text-slate-700 leading-relaxed">
          The BusinessInfoHeader component is fully responsive and adapts to different 
          screen sizes, ensuring a great user experience across all devices.
        </p>
      </main>
      
      {/* Example with minimal data */}
      <div className="bg-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Example with Minimal Data
          </h2>
          <BusinessInfoHeader businessData={minimalBusinessData} />
        </div>
      </div>
    </div>
  );
};

export default ExampleBusinessPage;

// Usage in different contexts
export const businessHeaderExamples = {
  // Full business data
  fullBusiness: sampleBusinessData,
  
  // Minimal business data
  minimalBusiness: minimalBusinessData,
  
  // Restaurant example
  restaurant: {
    name: "Mario's Italian Bistro",
    website: "https://mariositalian.com",
    address: "789 Culinary Lane, Food District, New York, NY 10001",
    phone: "+1 (555) PASTA-NY",
    socials: {
      facebook: "https://facebook.com/mariositalian",
      instagram: "https://instagram.com/mariositalian",
      twitter: "https://twitter.com/mariositalian"
    },
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.0123456789!2d-73.985130!3d40.748817!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDBCNDQnNTUuNyJOIDczwrA1OScwNi41Ilc!5e0!3m2!1sen!2sus!4v1637123456789!5m2!1sen!2sus"
  },
  
  // Law firm example
  lawFirm: {
    name: "Smith & Associates Legal",
    website: "https://smithlegal.com",
    address: "321 Justice Avenue, Legal Quarter, Chicago, IL 60601",
    phone: "+1 (555) LAW-FIRM",
    socials: {
      linkedin: "https://linkedin.com/company/smithlegal",
      twitter: "https://twitter.com/smithlegal"
    },
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2970.123456789!2d-87.623177!3d41.878113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDUyJzQxLjIiTiA4N8KwMzknMjMuNCJX!5e0!3m2!1sen!2sus!4v1637123456789!5m2!1sen!2sus"
  },
  
  // Medical practice example
  medicalPractice: {
    name: "Wellness Medical Center",
    website: "https://wellnessmedical.com",
    address: "555 Health Plaza, Medical District, Los Angeles, CA 90210",
    phone: "+1 (555) WELLNESS",
    socials: {
      facebook: "https://facebook.com/wellnessmedical",
      linkedin: "https://linkedin.com/company/wellnessmedical",
      youtube: "https://youtube.com/@wellnessmedical"
    },
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3304.123456789!2d-118.243685!3d34.052234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDAzJzA4LjAiTiAxMTjCsDE0JzM3LjMiVw!5e0!3m2!1sen!2sus!4v1637123456789!5m2!1sen!2sus"
  }
};