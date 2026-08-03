import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const SyncContext = createContext();

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);

    const updatePendingCount = () => {
        const queue = JSON.parse(localStorage.getItem('offline_irrigations') || '[]');
        setPendingCount(queue.length);
    };

    useEffect(() => {
        updatePendingCount();

        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Connexion rétablie !");
            syncPendingIrrigations();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error("Mode hors-ligne. Les données seront sauvegardées localement.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const saveOfflineIrrigation = (payload) => {
        const data = { ...payload, _offlineAt: new Date().toISOString() };
        const queue = JSON.parse(localStorage.getItem('offline_irrigations') || '[]');
        queue.push(data);
        localStorage.setItem('offline_irrigations', JSON.stringify(queue));
        updatePendingCount();
        toast.success("Session sauvegardée localement (hors-ligne)");
    };

    const syncPendingIrrigations = async () => {
        const queue = JSON.parse(localStorage.getItem('offline_irrigations') || '[]');
        if (queue.length === 0) return;

        toast.loading(`Synchronisation de ${queue.length} session(s)...`, { id: 'sync-toast' });
        
        const failedItems = [];
        let successCount = 0;

        for (const item of queue) {
            try {
                const payload = { ...item };
                delete payload._offlineAt;
                
                await axios.post(`${API_URL}/irrigations`, payload);
                successCount++;
            } catch (err) {
                console.error("Erreur de synchro pour un item", err);
                failedItems.push(item);
            }
        }

        localStorage.setItem('offline_irrigations', JSON.stringify(failedItems));
        updatePendingCount();

        if (successCount > 0) {
            toast.success(`${successCount} session(s) synchronisée(s) avec succès !`, { id: 'sync-toast' });
            window.dispatchEvent(new Event('irrigations-synced'));
        } else if (failedItems.length > 0) {
            toast.error("Échec de la synchronisation de certaines sessions.", { id: 'sync-toast' });
        }
    };

    return (
        <SyncContext.Provider value={{ isOnline, pendingCount, saveOfflineIrrigation, syncPendingIrrigations }}>
            {children}
        </SyncContext.Provider>
    );
};
