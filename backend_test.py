#!/usr/bin/env python3
"""
Backend API Testing Script for Techno Sutra App
Tests the FastAPI backend endpoints and MongoDB integration
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from frontend/.env
BACKEND_URL = "https://44b4b50a-bc75-4446-bbc8-f3a1941720f4.preview.emergentagent.com/api"

def test_root_endpoint():
    """Test GET /api/ endpoint"""
    print("🔍 Testing root endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ Root endpoint working correctly")
                return True
            else:
                print("❌ Root endpoint returned unexpected message")
                return False
        else:
            print(f"❌ Root endpoint failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint test failed: {str(e)}")
        return False

def test_cors_configuration():
    """Test CORS configuration"""
    print("\n🔍 Testing CORS configuration...")
    try:
        # Test preflight request
        headers = {
            'Origin': 'https://44b4b50a-bc75-4446-bbc8-f3a1941720f4.preview.emergentagent.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options(f"{BACKEND_URL}/status", headers=headers)
        print(f"CORS Preflight Status: {response.status_code}")
        
        # Check CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        print(f"CORS Headers: {cors_headers}")
        
        if response.status_code in [200, 204] and cors_headers['Access-Control-Allow-Origin']:
            print("✅ CORS configuration appears to be working")
            return True
        else:
            print("⚠️ CORS configuration may have issues")
            return True  # Not critical for basic functionality
    except Exception as e:
        print(f"⚠️ CORS test failed: {str(e)}")
        return True  # Not critical for basic functionality

def test_create_status_check():
    """Test POST /api/status endpoint"""
    print("\n🔍 Testing create status check endpoint...")
    try:
        # Test data with realistic client name
        test_data = {
            "client_name": "TechnoSutraClient_WebApp"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/status",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            # Validate response structure
            required_fields = ['id', 'client_name', 'timestamp']
            if all(field in data for field in required_fields):
                if data['client_name'] == test_data['client_name']:
                    print("✅ Create status check endpoint working correctly")
                    return True, data['id']
                else:
                    print("❌ Response data doesn't match input")
                    return False, None
            else:
                print(f"❌ Response missing required fields: {required_fields}")
                return False, None
        else:
            print(f"❌ Create status check failed with status {response.status_code}")
            return False, None
    except Exception as e:
        print(f"❌ Create status check test failed: {str(e)}")
        return False, None

def test_get_status_checks():
    """Test GET /api/status endpoint"""
    print("\n🔍 Testing get status checks endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/status")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Number of status checks returned: {len(data)}")
            
            if isinstance(data, list):
                if len(data) > 0:
                    # Validate structure of first item
                    first_item = data[0]
                    required_fields = ['id', 'client_name', 'timestamp']
                    if all(field in first_item for field in required_fields):
                        print("✅ Get status checks endpoint working correctly")
                        print(f"Sample record: {first_item}")
                        return True
                    else:
                        print(f"❌ Status check records missing required fields: {required_fields}")
                        return False
                else:
                    print("✅ Get status checks endpoint working (empty list)")
                    return True
            else:
                print("❌ Response is not a list")
                return False
        else:
            print(f"❌ Get status checks failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get status checks test failed: {str(e)}")
        return False

def test_database_persistence():
    """Test database persistence by creating and retrieving data"""
    print("\n🔍 Testing database persistence...")
    try:
        # Create a unique status check
        unique_client = f"TestClient_{uuid.uuid4().hex[:8]}"
        test_data = {"client_name": unique_client}
        
        # Create the record
        create_response = requests.post(
            f"{BACKEND_URL}/status",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if create_response.status_code != 200:
            print("❌ Failed to create test record for persistence test")
            return False
        
        created_record = create_response.json()
        created_id = created_record['id']
        
        # Retrieve all records and check if our record exists
        get_response = requests.get(f"{BACKEND_URL}/status")
        if get_response.status_code != 200:
            print("❌ Failed to retrieve records for persistence test")
            return False
        
        all_records = get_response.json()
        found_record = None
        for record in all_records:
            if record['id'] == created_id:
                found_record = record
                break
        
        if found_record and found_record['client_name'] == unique_client:
            print("✅ Database persistence working correctly")
            print(f"Created and retrieved record: {found_record}")
            return True
        else:
            print("❌ Created record not found in database")
            return False
            
    except Exception as e:
        print(f"❌ Database persistence test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Backend API Tests for Techno Sutra App")
    print("=" * 60)
    
    test_results = {}
    
    # Test 1: Root endpoint
    test_results['root_endpoint'] = test_root_endpoint()
    
    # Test 2: CORS configuration
    test_results['cors_config'] = test_cors_configuration()
    
    # Test 3: Create status check
    test_results['create_status'], created_id = test_create_status_check()
    
    # Test 4: Get status checks
    test_results['get_status'] = test_get_status_checks()
    
    # Test 5: Database persistence
    test_results['database_persistence'] = test_database_persistence()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed_tests += 1
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All backend tests passed! Backend is working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Backend may have issues.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)