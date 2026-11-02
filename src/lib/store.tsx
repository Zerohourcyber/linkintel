"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ParsedData } from "./types";
import type { RoleTarget } from "./advisorEngine";

interface DataStore {
    data: ParsedData | null;
    isLoading: boolean;
    error: string | null;
    targetRole: RoleTarget | null;
    setData: (data: ParsedData) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setTargetRole: (role: RoleTarget | null) => void;
    reset: () => void;
}

const DataContext = createContext<DataStore | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [data, setDataState] = useState<ParsedData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [targetRole, setTargetRoleState] = useState<RoleTarget | null>(null);

    const setData = useCallback((newData: ParsedData) => {
        setDataState(newData);
        setError(null);
    }, []);

    const setLoading = useCallback((loading: boolean) => {
        setIsLoading(loading);
    }, []);

    const setTargetRole = useCallback((role: RoleTarget | null) => {
        setTargetRoleState(role);
    }, []);

    const reset = useCallback(() => {
        setDataState(null);
        setIsLoading(false);
        setError(null);
        setTargetRoleState(null);
    }, []);

    return (
        <DataContext.Provider
            value={{ data, isLoading, error, targetRole, setData, setLoading, setError, setTargetRole, reset }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData(): DataStore {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}
