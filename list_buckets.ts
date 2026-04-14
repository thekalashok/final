import { Storage } from '@google-cloud/storage';

async function listBuckets() {
  try {
    const storage = new Storage();
    const bucketName = "studio-8069889936-a886e";
    const bucket = storage.bucket(bucketName);
    console.log("Attempting to get metadata for bucket:", bucketName);
    const [metadata] = await bucket.getMetadata();
    console.log("Bucket metadata:", metadata.name);
  } catch (e) {
    console.error("Error getting bucket:", e);
  }
}

listBuckets();
