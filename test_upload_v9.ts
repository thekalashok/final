import { Storage } from '@google-cloud/storage';

async function testUpload() {
  const bucketName = "studio-8069889936-a886e";
  console.log("Testing upload to:", bucketName);
  try {
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file("test.txt");
    await file.save("Hello World");
    console.log("Upload successful!");
  } catch (e: any) {
    console.error("Upload failed:", e.message);
  }
}

testUpload();
