#!/bin/bash

# Firebase Functions Environment Setup Script

# Set Firebase Functions configuration
firebase functions:config:set \
  firebase.api_key="your_api_key" \
  firebase.auth_domain="your_auth_domain" \
  firebase.project_id="your_project_id" \
  firebase.storage_bucket="your_storage_bucket" \
  firebase.messaging_sender_id="your_messaging_sender_id" \
  firebase.app_id="your_app_id" \
  firebase.client_email="your_client_email" \
  firebase.private_key="\"your_private_key\""

echo "Firebase Functions environment variables have been set."
echo "Please replace the placeholder values with your actual Firebase configuration."
echo "Note: For the private key, make sure to escape any special characters properly."

# Additional setup steps
echo "Installing dependencies..."
npm install

echo "Building the project..."
npm run build

echo "Setup complete. You can now run 'npm run serve' to start the Firebase emulator."