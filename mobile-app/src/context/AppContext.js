import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiBaseURL, setApiBaseURL] = useState('http://localhost:3000/api');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load saved API URL
      const savedURL = await AsyncStorage.getItem('api_base_url');
      if (savedURL) {
        setApiBaseURL(savedURL);
      }

      // Load profile
      await loadProfile();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await ApiService.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const updateProfile = async (data) => {
    try {
      setLoading(true);
      const response = await ApiService.saveProfile(data);
      if (response.success) {
        await loadProfile();
      }
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async (params = {}) => {
    try {
      setLoading(true);
      const response = await ApiService.getJobs(params);
      if (response.success) {
        setJobs(response.data);
      }
      return response;
    } catch (error) {
      console.error('Error loading jobs:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (params = {}) => {
    try {
      setLoading(true);
      const response = await ApiService.getApplications(params);
      if (response.success) {
        setApplications(response.data);
      }
      return response;
    } catch (error) {
      console.error('Error loading applications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await ApiService.getNotifications({ limit: 50 });
      if (response.success) {
        setNotifications(response.data);
      }
      return response;
    } catch (error) {
      console.error('Error loading notifications:', error);
      throw error;
    }
  };

  const updateAPIBaseURL = async (url) => {
    try {
      await ApiService.setBaseURL(url);
      setApiBaseURL(url);
      await AsyncStorage.setItem('api_base_url', url);
    } catch (error) {
      console.error('Error updating API base URL:', error);
      throw error;
    }
  };

  const value = {
    profile,
    jobs,
    applications,
    notifications,
    loading,
    apiBaseURL,
    updateProfile,
    loadProfile,
    loadJobs,
    loadApplications,
    loadNotifications,
    updateAPIBaseURL,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
