// Minimal IndexedDB-backed queue for observations captured while offline.
// No external dependency — pure browser IndexedDB.

export interface QueuedObservation {
  id: string;
  imageUrl: string;
  note?: string;
  location?: { lng: number; lat: number };
  assetId?: string;
  createdAt: string;
}

const DB_NAME = "spandan-offline";
const STORE = "pending-observations";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Offline storage is not available in this browser."));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error ?? new Error("Failed to open offline storage."));
  });
}

function runTx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

export async function enqueue(item: QueuedObservation): Promise<void> {
  await runTx("readwrite", (s) => s.put(item));
}

export async function allQueued(): Promise<QueuedObservation[]> {
  const result = await runTx<QueuedObservation[]>(
    "readonly",
    (s) => s.getAll() as IDBRequest<QueuedObservation[]>,
  );
  return result ?? [];
}

export async function dequeue(id: string): Promise<void> {
  await runTx("readwrite", (s) => s.delete(id));
}

export async function queueCount(): Promise<number> {
  const n = await runTx<number>("readonly", (s) => s.count());
  return n ?? 0;
}
