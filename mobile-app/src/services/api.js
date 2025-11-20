import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load saved base URL
    this.loadBaseURL();
  }

  async loadBaseURL() {
    try {
      const savedURL = await AsyncStorage.getItem('api_base_url');
      if (savedURL) {
        this.client.defaults.baseURL = savedURL;
      }
    } catch (error) {
      console.error('Error loading base URL:', error);
    }
  }

  async setBaseURL(url) {
    this.client.defaults.baseURL = url;
    await AsyncStorage.setItem('api_base_url', url);
  }

  // Jobs
  async getJobs(params = {}) {
    const response = await this.client.get('/jobs', { params });
    return response.data;
  }

  async getJob(id) {
    const response = await this.client.get(`/jobs/${id}`);
    return response.data;
  }

  async scrapeJobs(data) {
    const response = await this.client.post('/jobs/scrape', data);
    return response.data;
  }

  async updateJobStatus(id, status) {
    const response = await this.client.patch(`/jobs/${id}/status`, { status });
    return response.data;
  }

  // Profile
  async getProfile() {
    const response = await this.client.get('/profile');
    return response.data;
  }

  async saveProfile(data) {
    const response = await this.client.post('/profile', data);
    return response.data;
  }

  async extractProfile(url, type) {
    const response = await this.client.post('/profile/extract', { url, type });
    return response.data;
  }

  // Resumes
  async getResumes(params = {}) {
    const response = await this.client.get('/resumes', { params });
    return response.data;
  }

  async generateResume(data) {
    const response = await this.client.post('/resumes/generate', data);
    return response.data;
  }

  // Applications
  async getApplications(params = {}) {
    const response = await this.client.get('/applications', { params });
    return response.data;
  }

  async createApplication(data) {
    const response = await this.client.post('/applications', data);
    return response.data;
  }

  async updateApplicationStatus(id, status, notes) {
    const response = await this.client.patch(`/applications/${id}/status`, { status, notes });
    return response.data;
  }

  async sendFollowUp(id) {
    const response = await this.client.post(`/applications/${id}/followup`);
    return response.data;
  }

  // Companies
  async getCompanies(params = {}) {
    const response = await this.client.get('/companies', { params });
    return response.data;
  }

  async targetCompanies(companies) {
    const response = await this.client.post('/companies/target', { companies });
    return response.data;
  }

  async scrapeCompany(id) {
    const response = await this.client.post(`/companies/${id}/scrape`);
    return response.data;
  }

  // Recruiters
  async getRecruiters(params = {}) {
    const response = await this.client.get('/recruiters', { params });
    return response.data;
  }

  async findRecruiters(data) {
    const response = await this.client.post('/recruiters/find', data);
    return response.data;
  }

  async contactRecruiter(id, data) {
    const response = await this.client.post(`/recruiters/${id}/contact`, data);
    return response.data;
  }

  // API Control
  async getAPIConfig() {
    const response = await this.client.get('/control/config');
    return response.data;
  }

  async activateProvider(category, providerName) {
    const response = await this.client.post('/control/providers/activate', {
      category,
      providerName,
    });
    return response.data;
  }

  async testProvider(category, providerName) {
    const response = await this.client.post('/control/providers/test', {
      category,
      providerName,
    });
    return response.data;
  }

  // Analytics
  async getDashboardAnalytics() {
    const response = await this.client.get('/analytics/dashboard');
    return response.data;
  }

  async getResumeAnalytics() {
    const response = await this.client.get('/analytics/resumes');
    return response.data;
  }

  async getSourceAnalytics() {
    const response = await this.client.get('/analytics/sources');
    return response.data;
  }

  // Notifications
  async getNotifications(params = {}) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async markNotificationRead(id) {
    const response = await this.client.patch(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.post('/notifications/read-all');
    return response.data;
  }

  // Feature Builder
  async getFeatureRules(params = {}) {
    const response = await this.client.get('/features/rules', { params });
    return response.data;
  }

  async createFeatureRule(data) {
    const response = await this.client.post('/features/rules', data);
    return response.data;
  }

  async updateRuleStatus(id, isActive) {
    const response = await this.client.patch(`/features/rules/${id}/status`, { isActive });
    return response.data;
  }
}

export default new ApiService();
