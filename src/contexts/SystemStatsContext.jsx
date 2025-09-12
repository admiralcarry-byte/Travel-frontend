import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const SystemStatsContext = createContext();

export const useSystemStats = () => {
  const context = useContext(SystemStatsContext);
  if (!context) {
    throw new Error('useSystemStats must be used within a SystemStatsProvider');
  }
  return context;
};

export const SystemStatsProvider = ({ children }) => {
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalSales: 0,
    totalClients: 0,
    totalServices: 0,
    totalProviders: 0,
    systemUptime: '99.9%'
  });

  const [businessStats, setBusinessStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalClients: 0,
    totalServices: 0,
    activeUsers: 0,
    monthlyGrowth: 0
  });

  const [loading, setLoading] = useState(false);

  const fetchSystemStats = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, salesRes, clientsRes, servicesRes, providersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users?limit=100', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/sales?limit=1', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/clients?limit=1', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/services?limit=1', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/providers?limit=1', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setSystemStats({
        totalUsers: usersRes.data.data?.users?.length || 0,
        totalSales: salesRes.data.data?.total || 0,
        totalClients: clientsRes.data.data?.total || 0,
        totalServices: servicesRes.data.data?.total || 0,
        totalProviders: providersRes.data.data?.total || 0,
        systemUptime: '99.9%'
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBusinessStats = useCallback(async (users = []) => {
    try {
      const [salesRes, clientsRes, servicesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/reports/kpis', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/clients?limit=1', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/services?limit=1', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setBusinessStats({
        totalSales: salesRes.data.data.saleCount || 0,
        totalRevenue: salesRes.data.data.totalSales || 0,
        totalClients: clientsRes.data.data?.total || 0,
        totalServices: servicesRes.data.data?.total || 0,
        activeUsers: users.filter(u => u.role === 'seller').length,
        monthlyGrowth: 12.5 // Mock data - would come from analytics
      });
    } catch (error) {
      console.error('Error fetching business stats:', error);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await fetchSystemStats();
  }, [fetchSystemStats]);

  const value = {
    systemStats,
    businessStats,
    loading,
    fetchSystemStats,
    fetchBusinessStats,
    refreshStats
  };

  return (
    <SystemStatsContext.Provider value={value}>
      {children}
    </SystemStatsContext.Provider>
  );
};