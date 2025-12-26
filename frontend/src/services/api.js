// API service for Agentic Schedule database operations

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const isJson = (response.headers.get('content-type') || '').includes('application/json');

      if (!response.ok) {
        // Try to surface backend error details for easier debugging
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (isJson) {
          try {
            const body = await response.json();
            const candidate = body?.error_message || body?.message || body?.error || body;
            if (candidate) {
              errorMessage = `${errorMessage} - ${typeof candidate === 'string' ? candidate : JSON.stringify(candidate)}`;
            }
          } catch (_) {
            // ignore JSON parse errors
          }
        } else {
          try {
            const text = await response.text();
            if (text) errorMessage = `${errorMessage} - ${text}`;
          } catch (_) {}
        }
        throw new Error(errorMessage);
      }

      return isJson ? await response.json() : await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Map frontend table names to backend endpoints
  getEndpoint(tableName) {
    const endpointMap = {
      ContractsDetails: '/contracts',
      Staff: '/staff',
      Skills: '/skills',
      Shifts: '/shifts',
      DayOffRequests: '/dayoffrequests',
      ShiftOffRequests: '/shiftoffrequests',
      RequestType: '/requesttype', // backend is singular
      ShiftRequirements: '/shiftrequirements',
    };

    const endpoint = endpointMap[tableName];
    if (!endpoint) {
      throw new Error(`No API endpoint found for table: ${tableName}`);
    }
    return endpoint;
  }

  // Get table data
  async getTableData(tableName) {
    const endpoint = this.getEndpoint(tableName);
    const res = await this.request(endpoint);
    // unwrap payload using explicit payload key map
    const payloadKeyMap = {
      ContractsDetails: 'contracts',
      Staff: 'staff',
      Skills: 'skills',
      Shifts: 'shifts',
      DayOffRequests: 'dayOffRequests',
      ShiftOffRequests: 'shiftOffRequests',
      RequestType: 'requestTypes',
      ShiftRequirements: 'shiftRequirements',
    };

    if (res && res.payload) {
      const key = payloadKeyMap[tableName];
      return (key && res.payload[key]) ? res.payload[key] : [];
    }

    // fallback if backend returns array directly
    return Array.isArray(res) ? res : [];
  }

  // Get all tables data
  async getAllTableData() {
    const tables = [
      'ContractsDetails',
      'Staff',
      'Skills',
      'Shifts',
      'DayOffRequests',
      'ShiftOffRequests',
      'RequestType',
      'ShiftRequirements'
    ];
    const data = {};

    for (const table of tables) {
      try {
        data[table] = await this.getTableData(table);
      } catch (error) {
        console.error(`Error fetching ${table}:`, error);
        data[table] = [];
      }
    }
    return data;
  }

  // Create new record(s)
  async createRecord(tableName, data) {
    const endpoint = this.getEndpoint(tableName);
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bulk import records (array or single object)
  async importData(tableName, records) {
    const endpoint = this.getEndpoint(tableName);
    const payload = Array.isArray(records) ? records : [records];
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async startEvent({ eventName, horizon, startDate, endDate }) {
    return this.request('/startEvent', {
      method: 'POST',
      body: JSON.stringify({
        eventName,
        horizon,
        start_date: startDate,
        end_date: endDate
      })
    });
  }

  async saveEmployeeSchedule(schedules) {
    const payload = Array.isArray(schedules) ? schedules : [schedules];
    return this.request('/employeeSchedule', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getEmployeeScheduleByDateRange(startDate, endDate) {
    return this.request(`/employeeSchedule/date-range/${startDate}/${endDate}`);
  }

  async getStartEventReadiness(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString();
    return this.request(`/readiness${qs ? `?${qs}` : ''}`);
  }

  // Update existing record (only Staff + RequestType have GET by ID, so others may not support PUT)
  async updateRecord(tableName, id, data) {
    const endpoint = this.getEndpoint(tableName);
    return this.request(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete records (backend expects list of IDs in body, not /id path)
  async deleteRecord(tableName, ids) {
    const endpoint = this.getEndpoint(tableName);
    const idArray = Array.isArray(ids) ? ids : [ids];
    const deletePayloadKeyMap = {
      ContractsDetails: 'contractIds',
      Staff: 'staffIds',
      Skills: 'skillIds',
      Shifts: 'shiftIds',
      DayOffRequests: 'requestIds',
      ShiftOffRequests: 'requestIds',
      RequestType: 'requestTypeIds',
      ShiftRequirements: 'requirementIds',
    };
    const key = deletePayloadKeyMap[tableName];
    const body = key ? { [key]: idArray } : idArray;
    return this.request(endpoint, {
      method: 'DELETE',
      body: JSON.stringify(body),
    });
  }

  // Check if online
  isOnline() {
    return navigator.onLine;
  }

  // Test server connection
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/`);
      return response.ok;
    } catch (error) {
      console.error('Server connection test failed:', error);
      return false;
    }
  }
}

const apiService = new ApiService();
export default apiService;
