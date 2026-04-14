import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

async function testBuckets() {
  const projectID = firebaseConfig.projectId;
  const candidates = [
    firebaseConfig.storageBucket,
    `${projectID}.appspot.com`,
    `${projectID}.firebasestorage.app`,
    projectID
  ];

  console.log("Testing bucket candidates...");

  for (const name of candidates) {
    if (!name) continue;
    try {
      console.log(`\nTesting bucket: ${name}`);
      const bucket = admin.storage().bucket(name);
      // Try to check if it exists by getting metadata
      const [exists] = await bucket.exists();
      console.log(`Bucket ${name} exists: ${exists}`);
      if (exists) {
        console.log(`SUCCESS! Found working bucket: ${name}`);
      }
    } catch (e: any) {
      console.log(`Bucket ${name} failed: ${e.message}`);
    }
  }
}

testBuckets();
