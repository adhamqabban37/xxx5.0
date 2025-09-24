/**
 * Interactive Business Information Questionnaire
 * Collects missing business data to improve AEO optimization
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, MapPin, Phone, Mail, Clock, Star, Users, Award } from 'lucide-react';
import { BusinessInfo } from '../lib/business-extractor';

interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  questions: Question[];
  condition?: (businessInfo: Partial<BusinessInfo>) => boolean;
}

interface Question {
  id: string;
  type: 'text' | 'select' | 'multi-select' | 'textarea' | 'time' | 'phone' | 'email' | 'url';
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  validation?: (value: any) => string | null;
  helpText?: string;
}

interface BusinessQuestionnaireProps {
  initialBusinessInfo: Partial<BusinessInfo>;
  onComplete: (completeBusinessInfo: BusinessInfo) => void;
  onSkip: () => void;
}

const QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Business Information',
    description: 'Let\'s start with the essentials about your business',
    icon: Users,
    questions: [
      {
        id: 'businessName',
        type: 'text',
        label: 'Business Name',
        placeholder: 'Enter your business name',
        required: true
      },
      {
        id: 'legalName',
        type: 'text',
        label: 'Legal Business Name (if different)',
        placeholder: 'Legal entity name'
      },
      {
        id: 'industry',
        type: 'select',
        label: 'Industry',
        required: true,
        options: [
          'Healthcare & Medical',
          'Legal Services',
          'Real Estate',
          'Automotive',
          'Restaurant & Food Service',
          'Retail',
          'Construction & Contractors',
          'Beauty & Personal Care',
          'Fitness & Wellness',
          'Professional Services',
          'Home Services',
          'Technology',
          'Education',
          'Finance & Insurance',
          'Entertainment',
          'Other'
        ]
      },
      {
        id: 'yearEstablished',
        type: 'text',
        label: 'Year Established',
        placeholder: '2020',
        validation: (value) => {
          const year = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(year) || year < 1800 || year > currentYear) {
            return 'Please enter a valid year';
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'location',
    title: 'Location & Service Area',
    description: 'Help customers find you with accurate location information',
    icon: MapPin,
    questions: [
      {
        id: 'address.street',
        type: 'text',
        label: 'Street Address',
        placeholder: '123 Main Street',
        required: true
      },
      {
        id: 'address.city',
        type: 'text',
        label: 'City',
        placeholder: 'Your City',
        required: true
      },
      {
        id: 'address.state',
        type: 'text',
        label: 'State/Province',
        placeholder: 'CA',
        required: true
      },
      {
        id: 'address.zipCode',
        type: 'text',
        label: 'ZIP/Postal Code',
        placeholder: '90210',
        required: true
      },
      {
        id: 'serviceArea',
        type: 'textarea',
        label: 'Service Area (cities/regions you serve)',
        placeholder: 'Los Angeles, Beverly Hills, Santa Monica...',
        helpText: 'List all cities and areas where you provide services, separated by commas'
      }
    ]
  },
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'Make it easy for customers to reach you',
    icon: Phone,
    questions: [
      {
        id: 'phone',
        type: 'phone',
        label: 'Primary Phone Number',
        placeholder: '(555) 123-4567',
        required: true
      },
      {
        id: 'email',
        type: 'email',
        label: 'Business Email',
        placeholder: 'info@yourbusiness.com',
        required: true
      },
      {
        id: 'tollFree',
        type: 'phone',
        label: 'Toll-Free Number (if available)',
        placeholder: '(800) 123-4567'
      },
      {
        id: 'fax',
        type: 'phone',
        label: 'Fax Number (if available)',
        placeholder: '(555) 123-4568'
      }
    ]
  },
  {
    id: 'hours',
    title: 'Business Hours',
    description: 'Let customers know when you\'re open',
    icon: Clock,
    questions: [
      {
        id: 'hours.monday',
        type: 'text',
        label: 'Monday Hours',
        placeholder: '9:00 AM - 5:00 PM or Closed'
      },
      {
        id: 'hours.tuesday',
        type: 'text',
        label: 'Tuesday Hours',
        placeholder: '9:00 AM - 5:00 PM or Closed'
      },
      {
        id: 'hours.wednesday',
        type: 'text',
        label: 'Wednesday Hours',
        placeholder: '9:00 AM - 5:00 PM or Closed'
      },
      {
        id: 'hours.thursday',
        type: 'text',
        label: 'Thursday Hours',
        placeholder: '9:00 AM - 5:00 PM or Closed'
      },
      {
        id: 'hours.friday',
        type: 'text',
        label: 'Friday Hours',
        placeholder: '9:00 AM - 5:00 PM or Closed'
      },
      {
        id: 'hours.saturday',
        type: 'text',
        label: 'Saturday Hours',
        placeholder: '9:00 AM - 3:00 PM or Closed'
      },
      {
        id: 'hours.sunday',
        type: 'text',
        label: 'Sunday Hours',
        placeholder: 'Closed'
      }
    ]
  },
  {
    id: 'services',
    title: 'Services & Specialties',
    description: 'Help search engines understand what you offer',
    icon: Award,
    questions: [
      {
        id: 'services',
        type: 'textarea',
        label: 'Primary Services',
        placeholder: 'List your main services, one per line or separated by commas',
        required: true,
        helpText: 'Be specific - this helps with voice search and local SEO'
      },
      {
        id: 'specialties',
        type: 'textarea',
        label: 'Specialties & Certifications',
        placeholder: 'What makes your business unique?',
        helpText: 'Include certifications, awards, or unique expertise'
      },
      {
        id: 'employeeCount',
        type: 'select',
        label: 'Number of Employees',
        options: [
          '1-5 employees',
          '6-15 employees',
          '16-50 employees',
          '51-100 employees',
          '101-500 employees',
          '500+ employees'
        ]
      }
    ]
  },
  {
    id: 'online-presence',
    title: 'Online Presence',
    description: 'Connect your social media and review profiles',
    icon: Star,
    questions: [
      {
        id: 'socialMedia.facebook',
        type: 'url',
        label: 'Facebook Page URL',
        placeholder: 'https://facebook.com/yourbusiness'
      },
      {
        id: 'socialMedia.instagram',
        type: 'url',
        label: 'Instagram Profile URL',
        placeholder: 'https://instagram.com/yourbusiness'
      },
      {
        id: 'socialMedia.linkedin',
        type: 'url',
        label: 'LinkedIn Profile URL',
        placeholder: 'https://linkedin.com/company/yourbusiness'
      },
      {
        id: 'socialMedia.youtube',
        type: 'url',
        label: 'YouTube Channel URL',
        placeholder: 'https://youtube.com/yourbusiness'
      },
      {
        id: 'socialMedia.twitter',
        type: 'url',
        label: 'Twitter/X Profile URL',
        placeholder: 'https://twitter.com/yourbusiness'
      }
    ]
  }
];

export const BusinessQuestionnaire: React.FC<BusinessQuestionnaireProps> = ({
  initialBusinessInfo,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize answers with existing business info
  useEffect(() => {
    const initialAnswers: Record<string, any> = {};
    
    // Flatten the nested business info structure
    if (initialBusinessInfo.businessName) {
      initialAnswers['businessName'] = initialBusinessInfo.businessName;
    }
    if (initialBusinessInfo.industry) {
      initialAnswers['industry'] = initialBusinessInfo.industry;
    }
    if (initialBusinessInfo.contact) {
      Object.entries(initialBusinessInfo.contact).forEach(([key, value]) => {
        if (value) initialAnswers[key] = value;
      });
    }
    if (initialBusinessInfo.location?.address) {
      Object.entries(initialBusinessInfo.location.address).forEach(([key, value]) => {
        if (value) initialAnswers[`address.${key}`] = value;
      });
    }
    
    setAnswers(initialAnswers);
  }, [initialBusinessInfo]);

  const currentStepData = QUESTIONNAIRE_STEPS[currentStep];
  const isLastStep = currentStep === QUESTIONNAIRE_STEPS.length - 1;

  const handleInputChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: '' }));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    currentStepData.questions.forEach(question => {
      const value = answers[question.id];
      
      // Check required fields
      if (question.required && (!value || value.trim() === '')) {
        newErrors[question.id] = `${question.label} is required`;
        return;
      }
      
      // Run custom validation
      if (value && question.validation) {
        const validationError = question.validation(value);
        if (validationError) {
          newErrors[question.id] = validationError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (isLastStep) {
        handleComplete();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    // Convert flat answers back to BusinessInfo structure
    const completeBusinessInfo: BusinessInfo = {
      businessName: answers.businessName || '',
      legalName: answers.legalName,
      industry: answers.industry || '',
      location: {
        address: {
          street: answers['address.street'],
          city: answers['address.city'] || '',
          state: answers['address.state'],
          zipCode: answers['address.zipCode'],
          country: 'US'
        },
        serviceArea: answers.serviceArea ? answers.serviceArea.split(',').map((s: string) => s.trim()) : [],
        coordinates: initialBusinessInfo.location?.coordinates
      },
      contact: {
        phone: answers.phone,
        email: answers.email,
        website: initialBusinessInfo.contact?.website,
        fax: answers.fax,
        tollFree: answers.tollFree
      },
      services: answers.services ? answers.services.split(',').map((s: string) => s.trim()) : [],
      specialties: answers.specialties ? answers.specialties.split(',').map((s: string) => s.trim()) : [],
      attributes: {
        yearEstablished: answers.yearEstablished ? parseInt(answers.yearEstablished) : undefined,
        employeeCount: answers.employeeCount ? parseInt(answers.employeeCount.split('-')[0]) : undefined
      },
      hours: {
        monday: answers['hours.monday'],
        tuesday: answers['hours.tuesday'],
        wednesday: answers['hours.wednesday'],
        thursday: answers['hours.thursday'],
        friday: answers['hours.friday'],
        saturday: answers['hours.saturday'],
        sunday: answers['hours.sunday']
      },
      socialMedia: {
        facebook: answers['socialMedia.facebook'],
        instagram: answers['socialMedia.instagram'],
        linkedin: answers['socialMedia.linkedin'],
        youtube: answers['socialMedia.youtube'],
        twitter: answers['socialMedia.twitter']
      },
      marketing: {
        targetKeywords: initialBusinessInfo.marketing?.targetKeywords || [],
        targetAudience: initialBusinessInfo.marketing?.targetAudience || [],
        uniqueSellingPoints: initialBusinessInfo.marketing?.uniqueSellingPoints || []
      },
      metadata: {
        extractedAt: new Date(),
        sourceUrl: initialBusinessInfo.metadata?.sourceUrl || '',
        extractionMethods: [...(initialBusinessInfo.metadata?.extractionMethods || []), 'questionnaire'],
        confidence: 0.95,
        completeness: 0.9,
        needsReview: [],
        missingData: []
      }
    } as BusinessInfo;

    onComplete(completeBusinessInfo);
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || '';
    const error = errors[question.id];

    const baseClasses = `w-full px-4 py-3 border rounded-lg transition-colors ${
      error 
        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }`;

    switch (question.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select an option...</option>
            {question.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={3}
            className={baseClasses}
          />
        );

      default:
        return (
          <input
            type={question.type === 'phone' ? 'tel' : question.type === 'email' ? 'email' : question.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className={baseClasses}
          />
        );
    }
  };

  const progressPercentage = ((currentStep + 1) / QUESTIONNAIRE_STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Progress Bar */}
      <div className="px-6 pt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {QUESTIONNAIRE_STEPS.length}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <currentStepData.icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{currentStepData.title}</h2>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          {currentStepData.questions.map(question => (
            <div key={question.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {renderQuestion(question)}
              
              {errors[question.id] && (
                <p className="text-red-500 text-sm mt-1">{errors[question.id]}</p>
              )}
              
              {question.helpText && (
                <p className="text-gray-500 text-sm mt-1">{question.helpText}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          )}
          
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
        >
          {isLastStep ? 'Complete Setup' : 'Continue'}
          {!isLastStep && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};