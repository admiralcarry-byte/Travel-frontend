import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import PageTransition from './PageTransition';

const Layout = ({ children, showNavigation = true }) => {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupLabel) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  const isGroupActive = (group) => {
    return group.items?.some(item => {
      if (item.path.includes('?')) {
        const [path, query] = item.path.split('?');
        return location.pathname === path;
      }
      return location.pathname === item.path;
    });
  };

  const navigationItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    { 
      path: '/clients', 
      label: 'Passengers', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      path: '/providers', 
      label: 'Providers', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    // Seller and Admin navigation items
    ...(isSeller || isAdmin ? [
      { 
        path: '/inventory', 
        label: 'Cupos', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      },
    ] : []),
    { 
      path: '/sales', 
      label: 'Sales', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    { 
      path: '/search', 
      label: 'Quick Search', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    // // Payment Reports - Admin only
    // ...(isAdmin ? [{
    //   path: '/reports/payments', 
    //   label: 'Payment Reports', 
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    //     </svg>
    //   )
    // }] : []),
    // Admin-only navigation items
    ...(isAdmin ? [
      { 
        path: '/daily-reports', 
        label: 'Daily Reports', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )
      },
      {
        path: '/admin-insights', 
        label: 'Admin Insights', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      },
      {
        path: '/settings', 
        label: 'Settings', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      }
    ] : []),
    // Notifications navigation - DISABLED
    // { 
    //   path: '/notifications/history', 
    //   label: 'Notifications', 
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17h8l-2.586-2.586a2 2 0 00-2.828 0L4.828 17z" />
    //     </svg>
    //   )
    // },
  ];

  return (
    <PageTransition>
      <div className="flex h-screen">
        {/* Sidebar */}
        {showNavigation && (
          <div className="flex w-16 sm:w-20 md:w-72 flex-col">
            <div className="flex flex-col flex-grow pt-6 bg-dark-800 border-r border-white/10">
                {/* Logo */}
                <div className="flex items-center flex-shrink-0 px-2 sm:px-4 md:px-6 pb-6">
                  <div className="icon-container mr-2 sm:mr-3 md:mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h1 className="hidden md:block text-xl font-bold gradient-text font-poppins">
                    Travel AI Management
                  </h1>
                </div>
                
                {/* Border separator */}
                <div className="border-b border-white/10 mx-2 sm:mx-4 md:mx-6 mb-6"></div>
                
                {/* Navigation */}
                <div className="flex-grow flex flex-col px-1 sm:px-2 md:px-4">
                  <nav className="flex-1 space-y-1 sm:space-y-2">
                    {navigationItems.map((item) => {
                      if (item.type === 'group') {
                        const isExpanded = expandedGroups[item.label];
                        const isActive = isGroupActive(item);
                        
                        return (
                          <div key={item.label}>
                            <button
                              onClick={() => toggleGroup(item.label)}
                              className={`nav-link w-full text-left ${isActive ? 'active' : ''}`}
                              title={item.label}
                            >
                              <span className="mr-1 sm:mr-2 md:mr-3">{item.icon}</span>
                              <span className="hidden md:block flex-1">{item.label}</span>
                              <svg 
                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            
                            {isExpanded && (
                              <div className="ml-4 mt-1 space-y-1">
                                {item.items.map((subItem) => {
                                  let isSubItemActive = false;
                                  
                                  if (subItem.path.includes('?')) {
                                    // For items with query parameters (like /sales?tab=passengers)
                                    const [path, query] = subItem.path.split('?');
                                    isSubItemActive = location.pathname === path && location.search.includes(query);
                                  } else {
                                    // For items without query parameters (like /sales)
                                    isSubItemActive = location.pathname === subItem.path && !location.search;
                                  }
                                  
                                  return (
                                    <Link
                                      key={subItem.path}
                                      to={subItem.path}
                                      className={`nav-link text-sm pl-8 ${isSubItemActive ? 'active' : ''}`}
                                      title={subItem.label}
                                    >
                                      <span className="mr-2">{subItem.icon}</span>
                                      <span className="hidden md:block">{subItem.label}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            title={item.label}
                          >
                            <span className="mr-1 sm:mr-2 md:mr-3">{item.icon}</span>
                            <span className="hidden md:block">{item.label}</span>
                          </Link>
                        );
                      }
                    })}
                  </nav>
                </div>

                {/* User Profile Section */}
                {user && (
                  <div className="flex-shrink-0 border-t border-white/10 p-2 sm:p-4 md:p-6">
                    <div className="flex items-center w-full">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg shadow-lg">
                          {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-2 sm:ml-3 md:ml-4 flex-1 hidden md:block">
                        <p className="text-sm font-semibold text-dark-100">
                          {user?.username || user?.email}
                        </p>
                        <p className="text-xs text-dark-400 uppercase tracking-wide">
                          {user?.role}
                        </p>
                      </div>
                      <button
                        onClick={logout}
                        className="ml-1 sm:ml-2 md:ml-3 p-1 sm:p-2 rounded-lg text-dark-400 hover:text-error-500 hover:bg-error-500/10 transition-all duration-200"
                        title="Logout"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="pt-[50px] pb-8 px-[50px]"
              style={{margin: "40px 40px 40px 40px"}}
            >
              <div className="max-w-7xl mx-auto"
              >
                <div className="animate-fade-in-up"
                >
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </PageTransition>
  );
};

export default Layout;