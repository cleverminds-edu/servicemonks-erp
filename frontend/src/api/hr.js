import client from "./client";

export const markAttendance   = (data)         => client.post("/hr/attendance", data).then(r => r.data);
export const getAttendance    = (params)        => client.get("/hr/attendance", { params }).then(r => r.data);
export const getTodayAttendance = ()            => client.get("/hr/attendance/today").then(r => r.data);

export const getHolidays      = (params)        => client.get("/hr/holidays", { params }).then(r => r.data);
export const createHoliday    = (data)          => client.post("/hr/holidays", data).then(r => r.data);
export const deleteHoliday    = (id)            => client.delete(`/hr/holidays/${id}`).then(r => r.data);

export const getPayroll       = (params)        => client.get("/hr/payroll", { params }).then(r => r.data);
export const updateSalary     = (userId, salary) => client.put(`/hr/payroll/${userId}/salary`, { monthly_salary: salary }).then(r => r.data);
