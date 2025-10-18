import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

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
    monthlyGrowth: 0,
    usdSales: 0,
    arsSales: 0
  });

  const [loading, setLoading] = useState(false);

  const fetchSystemStats = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const [usersRes, salesRes, clientsRes, servicesRes, providersRes] = await Promise.all([
        api.get('/api/users?limit=100'),
        api.get('/api/sales?limit=1'),
        api.get('/api/clients?limit=1'),
        api.get('/api/services?limit=1'),
        api.get('/api/providers?limit=1')
      ]);

      // Log the responses for debugging
      // console.log('System Stats API Responses:', {
      //   users: usersRes.data,
      //   sales: salesRes.data,
      //   clients: clientsRes.data,
      //   services: servicesRes.data,
      //   providers: providersRes.data
      // });

      setSystemStats({
        totalUsers: usersRes.data.success ? (usersRes.data.data?.users?.length || 0) : 0,
        totalSales: salesRes.data.success ? (salesRes.data.data?.total || 0) : 0,
        totalClients: clientsRes.data.success ? (clientsRes.data.data?.total || 0) : 0,
        totalServices: servicesRes.data.success ? (servicesRes.data.data?.total || 0) : 0,
        totalProviders: providersRes.data.success ? (providersRes.data.data?.total || 0) : 0,
        systemUptime: '99.9%'
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Set default values when API fails
      setSystemStats({
        totalUsers: 0,
        totalSales: 0,
        totalClients: 0,
        totalServices: 0,
        totalProviders: 0,
        systemUptime: '99.9%'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBusinessStats = useCallback(async (users = []) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const [salesRes, clientsRes, servicesRes, currencyRes] = await Promise.all([
        api.get('/api/reports/kpis'),
        api.get('/api/clients/all-passengers?limit=1'),
        api.get('/api/services?limit=1'),
        api.get('/api/sales/currency-stats')
      ]);

      // Log the responses for debugging
      // console.log('Business Stats API Responses:', {
      //   sales: salesRes.data,
      //   clients: clientsRes.data,
      //   services: servicesRes.data,
      //   currency: currencyRes.data
      // });

      // Extract USD and ARS sales from currency stats
      let usdSales = 0;
      let arsSales = 0;
      
      if (currencyRes.data.success && currencyRes.data.data.currencyBreakdown) {
        const currencyData = currencyRes.data.data.currencyBreakdown;
        const usdData = currencyData.find(item => item._id === 'USD');
        const arsData = currencyData.find(item => item._id === 'ARS');
        
        usdSales = usdData ? usdData.totalSalesInCurrency || 0 : 0;
        arsSales = arsData ? arsData.totalSalesInCurrency || 0 : 0;
      }

      setBusinessStats({
        totalSales: salesRes.data.success ? (salesRes.data.data.saleCount || 0) : 0,
        totalRevenue: salesRes.data.success ? (salesRes.data.data.totalSales || 0) : 0,
        totalClients: clientsRes.data.success ? (clientsRes.data.data?.total || 0) : 0,
        totalServices: servicesRes.data.success ? (servicesRes.data.data?.total || 0) : 0,
        activeUsers: users.filter(u => u.role === 'seller').length,
        monthlyGrowth: 12.5, // Mock data - would come from analytics
        usdSales: usdSales,
        arsSales: arsSales
      });
    } catch (error) {
      console.error('Error fetching business stats:', error);
      // Set default values when API fails
      setBusinessStats({
        totalSales: 0,
        totalRevenue: 0,
        totalClients: 0,
        totalServices: 0,
        activeUsers: users.filter(u => u.role === 'seller').length,
        monthlyGrowth: 0,
        usdSales: 0,
        arsSales: 0
      });
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