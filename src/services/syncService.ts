import { toast } from 'sonner';
import { stockService } from './stockService';
import { caseService } from './caseService';
import { storage } from '../utils/storage';

// ADD_HISTORY removed: backend now handles history creation automatically in all services
export type ActionType = 'ADD_STOCK' | 'UPDATE_STOCK' | 'DELETE_STOCK' | 'ADD_CASE';

export interface OfflineAction {
    id: string;
    type: ActionType;
    payload: any;
    timestamp: number;
}

const QUEUE_KEY = 'offline_action_queue';

export const syncService = {
    getQueue: (): OfflineAction[] => {
        const data = localStorage.getItem(QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    },

    addToQueue: (type: ActionType, payload: any) => {
        const queue = syncService.getQueue();
        const action: OfflineAction = {
            id: crypto.randomUUID(),
            type,
            payload,
            timestamp: Date.now(),
        };
        queue.push(action);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        // toast.info('İşlem çevrimdışı kuyruğa eklendi');
    },

    clearQueue: () => {
        localStorage.removeItem(QUEUE_KEY);
    },

    sync: async () => {
        const queue = syncService.getQueue();
        if (queue.length === 0) {
            // Just pull fresh data
            await syncService.pullData();
            return { pushed: 0, pulled: true };
        }

        let pushedCount = 0;
        const failedActions: OfflineAction[] = [];

        // Process Queue (Push)
        const user = storage.getUser();
        const userId = user?.id;

        for (const action of queue) {
            try {
                switch (action.type) {
                    case 'ADD_STOCK':
                        await stockService.create(action.payload, userId);
                        break;
                    case 'UPDATE_STOCK':
                        await stockService.update(action.payload.id, action.payload, userId);
                        break;
                    case 'DELETE_STOCK':
                        await stockService.delete(action.payload.id, userId);
                        break;
                    case 'ADD_CASE':
                        await caseService.create({ ...action.payload, userId });
                        break;
                    // ADD_HISTORY is removed because the backend automatically tracks history
                }
                pushedCount++;
            } catch (error) {
                console.error(`Failed to sync action ${action.id}`, error);
                failedActions.push(action);
            }
        }

        // Update queue with failed items (if any)
        if (failedActions.length > 0) {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(failedActions));
        } else {
            localStorage.removeItem(QUEUE_KEY);
        }

        // Pull fresh data
        await syncService.pullData();

        return { pushed: pushedCount, pulled: true, failed: failedActions.length };
    },

    pullData: async () => {
        try {
            // Refresh all local data from backend
            await storage.getStock();
            await storage.getCases();
            await storage.getHistory();
            // Users are problematic to sync fully if not admin, but maybe current user?
            // storage.getUser() is usually just local session.
        } catch (error) {
            console.error('Pull failed', error);
            throw error;
        }
    }
};
