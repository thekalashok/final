import { Storage } from '@google-cloud/storage';

async function listBuckets() {
  try {
    const storage = new Storage();
    const [buckets] = await storage.getBuckets();
    console.log("Buckets found:", buckets.map(b => b.name));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

listBuckets();
