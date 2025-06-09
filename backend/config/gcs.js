import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();

const bucketName = process.env.GCS_BUCKET_NAME || "tcc-final-project";

// Create credentials object from environment variables
const credentials = {
  type: process.env.GOOGLE_CLOUD_TYPE,
  project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
  private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Convert escaped newlines
  client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
  auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI,
  token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
  universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN
};

// Validate required credentials
const requiredFields = [
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_PRIVATE_KEY',
  'GOOGLE_CLOUD_CLIENT_EMAIL'
];

for (const field of requiredFields) {
  if (!process.env[field]) {
    console.error(`Missing required Google Cloud credential: ${field}`);
    process.exit(1);
  }
}

console.log('Initializing Google Cloud Storage with environment credentials...');
console.log('Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
console.log('Client Email:', process.env.GOOGLE_CLOUD_CLIENT_EMAIL);
console.log('Bucket Name:', bucketName);

const storage = new Storage({
  credentials,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

const bucket = storage.bucket(bucketName);

// Test bucket access on initialization
bucket.exists()
  .then(([exists]) => {
    if (exists) {
      console.log(`✅ Successfully connected to GCS bucket: ${bucketName}`);
    } else {
      console.warn(`⚠️ Bucket ${bucketName} does not exist or no access`);
    }
  })
  .catch((error) => {
    console.error('❌ Failed to connect to GCS bucket:', error.message);
  });

export { bucket };
