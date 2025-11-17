'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from './socketContext';

const EmployeeContext = createContext();

export const useEmployee = () => {
    const context = useContext(EmployeeContext);
    if (!context) {
        throw new Error('useEmployee must be used within EmployeeProvider');
    }
    return context;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const EmployeeProvider = ({ children }) => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    const { socket, isConnected } = useSocket();

    // ✅ Get admin token
    const getToken = useCallback(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('adminToken');
        }
        return null;
    }, []);

    // ✅ Get config with auth header
    const getConfig = useCallback(() => ({
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }), [getToken]);

    // ✅ Socket event listeners
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleEmployeeRegistered = (data) => {
            setEmployees((prev) => {
                const employeeId = data.id || data._id;
                const exists = prev.some(emp => emp._id === employeeId);
                
                if (exists) {
                    return prev.map(emp => 
                        emp._id === employeeId 
                            ? { ...emp, ...data, _id: employeeId }
                            : emp
                    );
                }
                
                return [{ ...data, _id: employeeId }, ...prev];
            });
            setLastUpdate(Date.now());
        };

        const handleApproved = (data) => {
            const employeeId = data.id || data._id;
            
            setEmployees((prev) =>
                prev.map((emp) => 
                    emp._id === employeeId 
                        ? { 
                            ...emp,
                            isAproved: true,
                            approvedAt: data.approvedAt,
                            name: data.name,
                            email: data.email,
                            role: data.role
                          } 
                        : emp
                )
            );
            setLastUpdate(Date.now());
        };

        const handleRejected = (data) => {
            const employeeId = data.id || data._id || data.employeeId;
            setEmployees((prev) => prev.filter((emp) => emp._id !== employeeId));
            setLastUpdate(Date.now());
        };

        const handleDeleted = (data) => {
            const employeeId = data.id || data._id || data.employeeId;
            setEmployees((prev) => prev.filter((emp) => emp._id !== employeeId));
            setLastUpdate(Date.now());
        };

        const handleRoleUpdated = (data) => {
            const employeeId = data.id || data._id;
            
            setEmployees((prev) =>
                prev.map((emp) => 
                    emp._id === employeeId 
                        ? { 
                            ...emp,
                            role: data.newRole,
                            isAproved: data.isAproved,
                            name: data.name,
                            email: data.email
                          } 
                        : emp
                )
            );
            setLastUpdate(Date.now());
        };

        const handleEmployeeVerified = (data) => {
            const employeeId = data.id || data._id;
            
            setEmployees((prev) =>
                prev.map((emp) => 
                    emp._id === employeeId 
                        ? { ...emp, isVerified: true } 
                        : emp
                )
            );
            setLastUpdate(Date.now());
        };

        socket.on('employee:registered', handleEmployeeRegistered);
        socket.on('employee:approved', handleApproved);
        socket.on('employee:rejected', handleRejected);
        socket.on('employee:deleted', handleDeleted);
        socket.on('employee:roleUpdated', handleRoleUpdated);
        socket.on('employee:verified', handleEmployeeVerified);

        return () => {
            socket.off('employee:registered', handleEmployeeRegistered);
            socket.off('employee:approved', handleApproved);
            socket.off('employee:rejected', handleRejected);
            socket.off('employee:deleted', handleDeleted);
            socket.off('employee:roleUpdated', handleRoleUpdated);
            socket.off('employee:verified', handleEmployeeVerified);
        };
    }, [socket, isConnected]);

    // ✅ Get all employees
    const getAllEmployees = useCallback(async (forceRefresh = false) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await axios.get(`${API_URL}/api/admin/employ`, getConfig());

            if (response.data.success) {
                setEmployees(response.data.employees);
                setLastUpdate(Date.now());
            }
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to fetch employees';
            setError(message);
            return { success: false, message };
        } finally {
            setIsLoading(false);
        }
    }, [getConfig]);

    // ✅ Admin approve employee
    const approveEmployee = useCallback(async (employeeId) => {
        try {
            setError(null);
            const response = await axios.put(
                `${API_URL}/api/admin/employ/${employeeId}/approve`,
                {},
                getConfig()
            );
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to approve';
            setError(message);
            return { success: false, message };
        }
    }, [getConfig]);

    // ✅ Reject employee
    const rejectEmployee = useCallback(async (employeeId, reason) => {
        try {
            setError(null);
            const response = await axios.put(
                `${API_URL}/api/admin/employ/${employeeId}/reject`,
                { reason },
                getConfig()
            );
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to reject';
            setError(message);
            return { success: false, message };
        }
    }, [getConfig]);

    // ✅ Delete employee
    const deleteEmployee = useCallback(async (employeeId) => {
        try {
            setError(null);
            const response = await axios.delete(
                `${API_URL}/api/admin/employ/${employeeId}`,
                getConfig()
            );
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to delete';
            setError(message);
            return { success: false, message };
        }
    }, [getConfig]);

    // ✅ Update employee role
    const updateEmployeeRole = useCallback(async (employeeId, role) => {
        try {
            setError(null);
            const response = await axios.put(
                `${API_URL}/api/admin/employ/${employeeId}/role`,
                { role },
                getConfig()
            );
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to update role';
            setError(message);
            return { success: false, message };
        }
    }, [getConfig]);

    // ✅ Refresh employees
    const refreshEmployees = useCallback(async () => {
        await getAllEmployees(true);
    }, [getAllEmployees]);

    // ✅ Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = {
        employees,
        isLoading,
        error,
        lastUpdate,
        getAllEmployees,
        approveEmployee,
        rejectEmployee,
        deleteEmployee,
        updateEmployeeRole,
        refreshEmployees,
        clearError,
        // ✅ Computed values
        pendingEmployees: employees.filter(emp => !emp.isAproved),
        approvedEmployees: employees.filter(emp => emp.isAproved),
        totalEmployees: employees.length,
    };

    return (
        <EmployeeContext.Provider value={value}>
            {children}
        </EmployeeContext.Provider>
    );
};