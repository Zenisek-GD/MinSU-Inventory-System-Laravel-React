import api from './axios';

export const fetchAudits = (params = {}) =>
    api.get('/audits', { params }).then(r => r.data);

export const createAudit = (data) =>
    api.post('/audits', data).then(r => r.data);

export const updateAudit = (id, data) =>
    api.put(`/audits/${id}`, data).then(r => r.data);

export const deleteAudit = (id) =>
    api.delete(`/audits/${id}`).then(r => r.data);
