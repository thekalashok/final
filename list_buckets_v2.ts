import { Storage } from '@google-cloud/storage';
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

async function listBuckets() {
  try {
    const storage = new Storage({ projectId: firebaseConfig.projectId });
    const [buckets] = await storage.getBuckets();
    console.log("Buckets found in project:", buckets.map(b => b.name));
  } catch (e: any) {
    console.error("Error listing buckets:", e.message);
  }
}

listBuckets();
