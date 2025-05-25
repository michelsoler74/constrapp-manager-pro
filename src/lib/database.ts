export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed" | "paused";
  budget: number;
  progress: number;
  location: string;
  materials?: Material[];
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  supplier?: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  hourlyRate: number;
  photo?: string;
  skills: string[];
  status: "active" | "inactive";
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string[];
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  progress: number;
  createdAt: string;
  materials?: Material[];
  images?: string[];
}

export interface Attendance {
  id: string;
  workerId: string;
  projectId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  hoursWorked: number;
  notes?: string;
  createdAt: string;
}

class DatabaseManager {
  private dbName = "ConstrAPP";
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Projects store
        if (!db.objectStoreNames.contains("projects")) {
          const projectStore = db.createObjectStore("projects", {
            keyPath: "id",
          });
          projectStore.createIndex("status", "status", { unique: false });
        }

        // Workers store
        if (!db.objectStoreNames.contains("workers")) {
          const workerStore = db.createObjectStore("workers", {
            keyPath: "id",
          });
          workerStore.createIndex("status", "status", { unique: false });
        }

        // Tasks store
        if (!db.objectStoreNames.contains("tasks")) {
          const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
          taskStore.createIndex("projectId", "projectId", { unique: false });
          taskStore.createIndex("status", "status", { unique: false });
        }

        // Attendance store
        if (!db.objectStoreNames.contains("attendance")) {
          const attendanceStore = db.createObjectStore("attendance", {
            keyPath: "id",
          });
          attendanceStore.createIndex("workerId", "workerId", {
            unique: false,
          });
          attendanceStore.createIndex("projectId", "projectId", {
            unique: false,
          });
          attendanceStore.createIndex("date", "date", { unique: false });
        }
      };
    });
  }

  async add<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async update<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getById<T>(storeName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const db = new DatabaseManager();
