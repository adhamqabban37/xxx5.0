'use client';

import { useState } from 'react';
import { Crown, X, Zap, BarChart3, Users, Target, TrendingUp, Calendar } from 'lucide-react';

export function CEOActionCenter() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {/* CEO Action Center Button */}
      <button
        onClick={openModal}
        className="relative inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        <Crown className="w-4 h-4" />
        <span>CEO Action Center</span>
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm">
          BETA
        </span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">CEO Action Center</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="bg-blue-500 text-white text-sm px-2 py-1 rounded-full font-bold">
                        BETA
                      </span>
                      <span className="text-amber-100 text-sm">Executive Command Dashboard</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-amber-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Beta Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Beta Version - Coming Soon!
                    </h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      The CEO Action Center is currently in beta development. This powerful
                      executive dashboard will provide high-level insights, strategic
                      recommendations, and executive-level analytics for business decision making.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Features */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  What's Coming in the CEO Action Center
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Executive Analytics */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Executive Analytics</h4>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• ROI tracking across all campaigns</li>
                      <li>• High-level performance metrics</li>
                      <li>• Strategic KPI dashboards</li>
                      <li>• Executive summary reports</li>
                    </ul>
                  </div>

                  {/* Strategic Insights */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <Target className="w-6 h-6 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Strategic Insights</h4>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Market opportunity analysis</li>
                      <li>• Competitive positioning</li>
                      <li>• Growth recommendations</li>
                      <li>• Resource allocation guidance</li>
                    </ul>
                  </div>

                  {/* Team Performance */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <Users className="w-6 h-6 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Team Performance</h4>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Marketing team efficiency</li>
                      <li>• Campaign performance by team</li>
                      <li>• Resource utilization metrics</li>
                      <li>• Goal achievement tracking</li>
                    </ul>
                  </div>

                  {/* Predictive Forecasting */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Predictive Forecasting</h4>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• AI-powered growth predictions</li>
                      <li>• Market trend analysis</li>
                      <li>• Revenue forecasting</li>
                      <li>• Risk assessment alerts</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Calendar className="w-6 h-6 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Development Timeline</h3>
                </div>
                <div className="space-y-2 text-sm text-amber-800">
                  <div className="flex justify-between">
                    <span>Beta Testing Phase:</span>
                    <span className="font-medium">Q4 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Early Access Release:</span>
                    <span className="font-medium">Q1 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Full Launch:</span>
                    <span className="font-medium">Q2 2026</span>
                  </div>
                </div>
              </div>

              {/* Early Access CTA */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Want Early Access?</h3>
                <p className="text-gray-600 mb-4">
                  Premium users will get priority access to the CEO Action Center beta when it
                  launches.
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Got It
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Add notification signup logic
                      closeModal();
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-300"
                  >
                    Notify Me When Ready
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
