#!/usr/bin/env python3

import os
import sys
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials
from google.auth import default

# Add the app directory to the path
sys.path.append('/Users/paulgaudin/Desktop/underwritRE_app/uw_backend')

SERVICE_ACCOUNT_FILE = os.getenv("SERVICE_ACCOUNT_FILE", "dev_db_service_account.json")

def test_drive_access():
    print("🔍 Testing Google Drive API Access...")
    
    # Load credentials
    SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    
    if SERVICE_ACCOUNT_FILE and os.path.exists("./" + SERVICE_ACCOUNT_FILE):
        print(f"🔑 Using local service account credentials: {SERVICE_ACCOUNT_FILE}")
        creds = Credentials.from_service_account_file("./" + SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    else:
        print("🔐 Using default GCP credentials")
        creds, _ = default(scopes=SCOPES)
    
    # Build the service
    drive_service = build('drive', 'v3', credentials=creds)
    
    # Test the problematic folder ID
    folder_id = "14dBWRN-2ItiRLRy9HWfy1U3oF_p7MzPt"
    print(f"\n📁 Testing access to folder: {folder_id}")
    
    try:
        # Test 1: Get folder info
        print("🔍 Test 1: Getting folder info...")
        folder_info = drive_service.files().get(
            fileId=folder_id, 
            fields='id, name, mimeType, parents, capabilities, driveId',
            supportsAllDrives=True
        ).execute()
        print(f"✅ Folder info: {folder_info}")
        
        # Check if it's in a Shared Drive
        if folder_info.get('driveId'):
            print(f"🔗 This folder is in a Shared Drive: {folder_info.get('driveId')}")
        else:
            print("📁 This folder is in regular Google Drive")
        
        # Test 2: List contents with minimal query
        print("\n🔍 Test 2: Listing contents with minimal query...")
        minimal_results = drive_service.files().list(
            q=f"'{folder_id}' in parents",
            fields='files(id, name, mimeType, trashed)',
            pageSize=10,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True
        ).execute()
        files = minimal_results.get('files', [])
        print(f"📋 Found {len(files)} items:")
        for file in files[:5]:  # Show first 5
            print(f"  - {file.get('name')} ({file.get('mimeType')}) - Trashed: {file.get('trashed')}")
        
        # Test 3: Count folders named 'paulgaudin314@gmail.com'
        print(f"\n🔍 Test 3: Counting folders named 'paulgaudin314@gmail.com'...")
        search_results = drive_service.files().list(
            q=f"name='paulgaudin314@gmail.com' and '{folder_id}' in parents and mimeType='application/vnd.google-apps.folder'",
            fields='files(id, name, mimeType, trashed)',
            pageSize=1000,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True
        ).execute()
        matching_folders = search_results.get('files', [])
        print(f"📊 Found {len(matching_folders)} folders named 'paulgaudin314@gmail.com'")
        
        # Show first few
        for i, folder in enumerate(matching_folders[:3]):
            print(f"  {i+1}. ID: {folder.get('id')}, Trashed: {folder.get('trashed')}")
        
        if len(matching_folders) > 3:
            print(f"  ... and {len(matching_folders) - 3} more")
            
        # Test 4: Check for non-trashed folders
        non_trashed = [f for f in matching_folders if not f.get('trashed')]
        print(f"📊 Non-trashed folders: {len(non_trashed)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_drive_access() 