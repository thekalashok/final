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

async function testUUIDBucket() {
  const uuid = "9d5afa0a-be4b-461d-814e-ca297f780e42";
  const candidates = [
    `ai-studio-${uuid}.appspot.com`,
    `ai-studio-${uuid}.firebasestorage.app`,
    `${uuid}.appspot.com`,
    `${uuid}.firebasestorage.app`
  ];

  for (const name of candidates) {
    try {
      console.log(`Testing: ${name}`);
      const bucket = admin.storage().bucket(name);
      const [exists] = await bucket.exists();
      if (exists) {
        console.log(`SUCCESS! Found: ${name}`);
        return;
      }
    } catch (e) {
      // ignore
    }
  }
  console.log("None of the UUID candidates worked.");
}

testUUIDBucket();
