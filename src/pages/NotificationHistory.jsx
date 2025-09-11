import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationHistory = () => {
  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Notification History
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Track and manage all sent notifications
          </p>
        </div>

        {/* Content */}
        <div className="card p-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="icon-container bg-primary-500 mr-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM4 19h6v2H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v11l-4-4H4z" />
                </svg>
              </div>
              <h3 className="text-3xl font-semibold text-dark-100">
                No notifications yet
              </h3>
            </div>
            <p className="text-dark-300 mb-8 max-w-md mx-auto text-lg">
              Notification history will be displayed here when notifications are sent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationHistory;