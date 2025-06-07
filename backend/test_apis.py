#!/usr/bin/env python3
"""
Complete API testing script
Used to test all API endpoints of the AI Society Dashboard

Usage:
1. Ensure the server is running on localhost:8000
2. Set a valid access_token in the code (requires admin privileges)
3. Run: python test_apis.py
"""

import requests
import json
from typing import Dict, Any, List
from datetime import datetime, date

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        # Set your access_token directly here (requires admin privileges)
        self.access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDk2MDgyODcsInN1YiI6IjExIn0.ZxESHRIwqpBo15KgwmG3TLr-5DKz0Bv0001W1ltH3Go"  # Please replace with your actual admin token
        
        # Store created resource IDs for subsequent tests
        self.created_resources = {
            'roles': [],
            'portfolios': [],
            'tasks': [],
            'meetings': [],
            'assignments': []
        }
        
    def log_test(self, method: str, endpoint: str, status_code: int, success: bool, details: str = ""):
        """Log test results"""
        status = "✅" if success else "❌"
        detail_text = f" - {details}" if details else ""
        print(f"{status} {method:6} {endpoint:50} [{status_code}]{detail_text}")
    
    def test_endpoint(self, method: str, endpoint: str, data: Dict = None, auth: bool = True, expected_status: int = None) -> Dict[str, Any]:
        """Test a single endpoint"""
        url = f"{API_V1}{endpoint}"
        headers = {}
        
        if auth and self.access_token and self.access_token != "YOUR_ADMIN_ACCESS_TOKEN_HERE":
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            if method == "GET":
                response = self.session.get(url, headers=headers)
            elif method == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers)
            
            # Determine success criteria
            if expected_status:
                success = response.status_code == expected_status
            else:
                success = response.status_code < 400
            
            response_data = None
            try:
                response_data = response.json() if response.text else None
            except:
                pass
            
            details = ""
            if success and response_data:
                if method == "POST" and "id" in str(response_data):
                    # Extract created resource ID
                    if "role_id" in response_data:
                        details = f"Created role_id: {response_data['role_id']}"
                    elif "portfolio_id" in response_data:
                        details = f"Created portfolio_id: {response_data['portfolio_id']}"
                    elif "task_id" in response_data:
                        details = f"Created task_id: {response_data['task_id']}"
                    elif "meeting_id" in response_data:
                        details = f"Created meeting_id: {response_data['meeting_id']}"
                    elif "assignment_id" in response_data:
                        details = f"Created assignment_id: {response_data['assignment_id']}"
            
            self.log_test(method, endpoint, response.status_code, success, details)
            
            return {
                "status_code": response.status_code,
                "success": success,
                "data": response_data
            }
        except Exception as e:
            self.log_test(method, endpoint, 0, False, f"Error: {str(e)}")
            return {"status_code": 0, "success": False, "error": str(e)}
    
    def test_health(self):
        """Test service health status"""
        print("\n🔍 Testing service health status")
        try:
            response = requests.get(BASE_URL, timeout=5)
            if response.status_code == 200:
                print("✅ Server is running normally")
                return True
            else:
                print(f"❌ Server response is abnormal: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Unable to connect to server: {e}")
            print("Please ensure the server is running on localhost:8000")
            return False
    
    def test_authentication(self):
        """Validate token validity"""
        print("\n🔐 Validating access token")
        
        if not self.access_token or self.access_token == "YOUR_ADMIN_ACCESS_TOKEN_HERE":
            print("   ⚠️  Please set a valid admin access_token in the code")
            return False
        
        # Validate token by retrieving user information
        result = self.test_endpoint("GET", "/users/me")
        if result["success"]:
            print(f"   🎫 Access token is valid")
            return True
        else:
            print("   ❌ Access token is invalid or expired")
            return False
    
    def test_roles_crud(self):
        """Test complete CRUD operations for role management"""
        print("\n👥 Testing role management (CRUD)")
        
        # 1. Create role
        print("   📝 Creating role...")
        role_data = {
            "role_name": f"Test Role {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test role created by API test"
        }
        result = self.test_endpoint("POST", "/roles/", role_data)
        if result["success"] and result["data"]:
            role_id = result["data"]["role_id"]
            self.created_resources['roles'].append(role_id)
            
            # 2. Get role details
            print("   📖 Getting role details...")
            self.test_endpoint("GET", f"/roles/{role_id}")
            
            # 3. Update role
            print("   ✏️  Updating role...")
            update_data = {
                "description": "Updated description for test role"
            }
            self.test_endpoint("PUT", f"/roles/{role_id}", update_data)
            
            # 4. Get role list
            print("   📋 Getting role list...")
            self.test_endpoint("GET", "/roles/")
            self.test_endpoint("GET", "/roles/all/simple")
            self.test_endpoint("GET", "/roles/with-counts/")
            
            # 5. Search for roles
            print("   🔍 Searching for roles...")
            self.test_endpoint("GET", "/roles/search/?q=Test")
            
            # 6. Get role by name
            print("   📛 Getting role by name...")
            self.test_endpoint("GET", f"/roles/name/{role_data['role_name']}")
        else:
            print("   ⚠️  Role creation failed, skipping subsequent tests")
    
    def test_portfolios_crud(self):
        """Test complete CRUD operations for portfolio management"""
        print("\n📁 Testing portfolio management (CRUD)")
        
        # 1. Create portfolio
        print("   📝 Creating portfolio...")
        portfolio_data = {
            "name": f"Test Portfolio {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test portfolio created by API test",
            "channel_id": "test-channel-123"
        }
        result = self.test_endpoint("POST", "/portfolios/", portfolio_data)
        if result["success"] and result["data"]:
            portfolio_id = result["data"]["portfolio_id"]
            self.created_resources['portfolios'].append(portfolio_id)
            
            # 2. Get portfolio details
            print("   📖 Getting portfolio details...")
            self.test_endpoint("GET", f"/portfolios/{portfolio_id}")
            
            # 3. Update portfolio
            print("   ✏️  Updating portfolio...")
            update_data = {
                "description": "Updated description for test portfolio"
            }
            self.test_endpoint("PUT", f"/portfolios/{portfolio_id}", update_data)
            
            # 4. Get portfolio list
            print("   📋 Getting portfolio list...")
            self.test_endpoint("GET", "/portfolios/")
            self.test_endpoint("GET", "/portfolios/all/simple")
            self.test_endpoint("GET", "/portfolios/with-channels/")
            self.test_endpoint("GET", "/portfolios/without-channels/")
            
            # 5. Get portfolio statistics
            print("   📊 Getting portfolio statistics...")
            self.test_endpoint("GET", "/portfolios/statistics/all")
            self.test_endpoint("GET", f"/portfolios/{portfolio_id}/statistics")
            
            # 6. Search for portfolios
            print("   🔍 Searching for portfolios...")
            self.test_endpoint("GET", "/portfolios/search/?q=Test")
            
            # 7. Get portfolio by name and channel
            print("   📛 Getting portfolio by name...")
            self.test_endpoint("GET", f"/portfolios/name/{portfolio_data['name']}")
            print("   📺 Getting portfolio by channel...")
            self.test_endpoint("GET", f"/portfolios/channel/{portfolio_data['channel_id']}")
        else:
            print("   ⚠️  Portfolio creation failed, skipping subsequent tests")
    
    def test_tasks_crud(self):
        """Test complete CRUD operations for task management"""
        print("\n📝 Testing task management (CRUD)")
        
        # Ensure there are portfolios created first
        if not self.created_resources['portfolios']:
            print("   ⚠️  A portfolio must be created first to create a task")
            return
        
        portfolio_id = self.created_resources['portfolios'][0]
        
        # 1. Create task
        print("   📝 Creating task...")
        task_data = {
            "title": f"Test Task {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test task created by API test",
            "status": "Not Started",
            "priority": "high",
            "deadline": "2025-12-31T23:59:59",
            "portfolio_id": portfolio_id
        }
        result = self.test_endpoint("POST", "/tasks/", task_data)
        if result["success"] and result["data"]:
            task_id = result["data"]["task_id"]
            self.created_resources['tasks'].append(task_id)
            
            # 2. Get task details
            print("   📖 Getting task details...")
            self.test_endpoint("GET", f"/tasks/{task_id}")
            
            # 3. Update task
            print("   ✏️  Updating task...")
            update_data = {
                "status": "In Progress",
                "description": "Updated description for test task"
            }
            self.test_endpoint("PUT", f"/tasks/{task_id}", update_data)
            
            # 4. Get task list
            print("   📋 Getting task list...")
            self.test_endpoint("GET", "/tasks/")
            self.test_endpoint("GET", f"/tasks/portfolio/{portfolio_id}")
            
            # 5. Search for tasks
            print("   🔍 Searching for tasks...")
            self.test_endpoint("GET", "/tasks/search/?q=Test")
            
            # 6. Test subtask functionality
            print("   👶 Testing subtasks...")
            self.test_endpoint("GET", f"/tasks/subtasks/{task_id}")
            
            # 7. Test meeting associated tasks
            print("   🎤 Testing meeting associated tasks...")
            if self.created_resources['meetings']:
                meeting_id = self.created_resources['meetings'][0]
                self.test_endpoint("GET", f"/tasks/meeting/{meeting_id}")
        else:
            print("   ⚠️  Task creation failed, skipping subsequent tests")
    
    def test_meetings_crud(self):
        """Test complete CRUD operations for meeting records"""
        print("\n🎤 Testing meeting records (CRUD)")
        
        # Ensure there are portfolios created first
        if not self.created_resources['portfolios']:
            print("   ⚠️  A portfolio must be created first to create meeting records")
            return
        
        portfolio_id = self.created_resources['portfolios'][0]
        
        # 1. Create meeting record
        print("   📝 Creating meeting record...")
        meeting_data = {
            "meeting_date": "2025-01-15",
            "meeting_name": f"Test Meeting {datetime.now().strftime('%H%M%S')}",
            "recording_file_link": "https://example.com/recording.mp4",
            "auto_caption": "This is auto-generated caption text",
            "summary": "This is a test meeting summary",
            "portfolio_id": portfolio_id
        }
        result = self.test_endpoint("POST", "/meeting-records/", meeting_data)
        if result["success"] and result["data"]:
            meeting_id = result["data"]["meeting_id"]
            self.created_resources['meetings'].append(meeting_id)
            
            # 2. Get meeting record details
            print("   📖 Getting meeting record details...")
            self.test_endpoint("GET", f"/meeting-records/{meeting_id}")
            
            # 3. Update meeting record
            print("   ✏️  Updating meeting record...")
            update_data = {
                "summary": "Updated summary for test meeting"
            }
            self.test_endpoint("PUT", f"/meeting-records/{meeting_id}", update_data)
            
            # 4. Get meeting record list
            print("   📋 Getting meeting record list...")
            self.test_endpoint("GET", "/meeting-records/")
            self.test_endpoint("GET", "/meeting-records/with-recordings/")
            self.test_endpoint("GET", "/meeting-records/with-summaries/")
            self.test_endpoint("GET", f"/meeting-records/portfolio/{portfolio_id}")
            
            # 5. Search for meeting records
            print("   🔍 Searching for meeting records...")
            self.test_endpoint("GET", "/meeting-records/search/?q=Test")
        else:
            print("   ⚠️  Meeting record creation failed, skipping subsequent tests")
    
    def test_task_assignments_crud(self):
        """Test complete CRUD operations for task assignments"""
        print("\n📋 Testing task assignments (CRUD)")
        
        # Ensure there are tasks created first
        if not self.created_resources['tasks']:
            print("   ⚠️  A task must be created first to perform task assignments")
            return
        
        task_id = self.created_resources['tasks'][0]
        
        # First, get current user information
        user_result = self.test_endpoint("GET", "/users/me")
        if not user_result["success"]:
            print("   ⚠️  Unable to retrieve current user information")
            return
        
        user_id = user_result["data"]["user_id"]
        
        # 1. Create task assignment
        print("   📝 Creating task assignment...")
        assignment_data = {
            "task_id": task_id,
            "user_id": user_id
        }
        result = self.test_endpoint("POST", "/task-assignments/", assignment_data)
        if result["success"] and result["data"]:
            assignment_id = result["data"]["assignment_id"]
            self.created_resources['assignments'].append(assignment_id)
            
            # 2. Get task assignment details
            print("   📖 Getting task assignment details...")
            self.test_endpoint("GET", f"/task-assignments/{assignment_id}")
            
            # 3. Get task assignment list
            print("   📋 Getting task assignment list...")
            self.test_endpoint("GET", "/task-assignments/")
            self.test_endpoint("GET", f"/task-assignments/task/{task_id}/users")
            self.test_endpoint("GET", f"/task-assignments/user/{user_id}/tasks")
            
            # 4. Test bulk task assignment creation
            print("   📝 Testing bulk task assignment...")
            bulk_data = {
                "task_id": task_id,
                "user_ids": [user_id]  # Assign only to the current user
            }
            self.test_endpoint("POST", "/task-assignments/bulk", bulk_data)
        else:
            print("   ⚠️  Task assignment creation failed, skipping subsequent tests")
    
    def test_user_api(self):
        """Test user API"""
        print("\n👤 Testing user functionality")
        
        self.test_endpoint("GET", "/users/me")
    
    def cleanup_created_resources(self):
        """Clean up resources created during testing"""
        print("\n🧹 Cleaning up test resources...")
        
        # Delete task assignments
        for assignment_id in self.created_resources['assignments']:
            self.test_endpoint("DELETE", f"/task-assignments/{assignment_id}", expected_status=200)
        
        # Delete meeting records
        for meeting_id in self.created_resources['meetings']:
            self.test_endpoint("DELETE", f"/meeting-records/{meeting_id}", expected_status=200)
        
        # Delete tasks
        for task_id in self.created_resources['tasks']:
            self.test_endpoint("DELETE", f"/tasks/{task_id}", expected_status=200)
        
        # Delete portfolios
        for portfolio_id in self.created_resources['portfolios']:
            self.test_endpoint("DELETE", f"/portfolios/{portfolio_id}", expected_status=200)
        
        # Delete roles
        for role_id in self.created_resources['roles']:
            self.test_endpoint("DELETE", f"/roles/{role_id}", expected_status=200)
    
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Complete testing of AI Society Dashboard API")
        print("=" * 80)
        
        # 1. Health check
        if not self.test_health():
            return
        
        # 2. Validate token
        if not self.test_authentication():
            print("   ⚠️  Token is invalid, admin token is required for complete testing")
            return
        
        try:
            # 3. API tests for each module (in order of dependencies)
            self.test_user_api()
            self.test_roles_crud()           # Create roles
            self.test_portfolios_crud()      # Create portfolios
            self.test_tasks_crud()           # Create tasks (depends on portfolios)
            self.test_meetings_crud()        # Create meeting records (depends on portfolios)
            self.test_task_assignments_crud() # Create task assignments (depends on tasks and users)
            
            # 4. Clean up resources
            self.cleanup_created_resources()
            
        except KeyboardInterrupt:
            print("\n\n⚠️  Testing interrupted, starting resource cleanup...")
            self.cleanup_created_resources()
            print("Cleanup complete!")
            return
        
        print("\n" + "=" * 80)
        print("🎉 Testing complete!")
        print("\n💡 Test summary:")
        print("- ✅ Indicates API responded normally")
        print("- ❌ Indicates API is abnormal or needs further inspection")
        print("- Tests executed in CRUD order: Create → Read → Update → Delete")
        print("- Test resources have been automatically cleaned up")
        print("- It is recommended to perform detailed testing in Swagger UI (http://localhost:8000/docs)")
        print(f"- Resource statistics created:")
        print(f"  - Roles: {len(self.created_resources['roles'])} created")
        print(f"  - Portfolios: {len(self.created_resources['portfolios'])} created")
        print(f"  - Tasks: {len(self.created_resources['tasks'])} created")
        print(f"  - Meeting records: {len(self.created_resources['meetings'])} created")
        print(f"  - Task assignments: {len(self.created_resources['assignments'])} created")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests() 