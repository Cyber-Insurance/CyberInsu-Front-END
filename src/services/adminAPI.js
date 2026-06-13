import api from './api';

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRoles: () => api.get('/admin/roles'),
  getPermissions: () => api.get('/admin/permissions'),
  updateRolePermissions: (roleId, permissionIds) =>
    api.put(`/admin/roles/${roleId}/permissions`, { permission_ids: permissionIds }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getHealth: () => api.get('/admin/health'),
};
