#!/usr/bin/env python3
"""
Comprehensive test suite for Vacations module endpoints.
Tests ONLY /api/vacations endpoints as per review request.
"""

import requests
import json
from datetime import date, timedelta
from typing import Dict, Optional

# Backend URL from frontend/.env
BACKEND_URL = "https://run-project-32.preview.emergentagent.com"
BASE_URL = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "maria@empresa.com"
ADMIN_PASSWORD = "maria123"
ADMIN_EMPLOYEE_ID = "1"

EMPLEADO_EMAIL = "juan@empresa.com"
EMPLEADO_PASSWORD = "juan123"
EMPLEADO_EMPLOYEE_ID = "2"

# Color codes for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, test_name: str, details: str = ""):
        self.passed.append((test_name, details))
        print(f"{GREEN}✓ PASS{RESET}: {test_name}")
        if details:
            print(f"  {details}")
    
    def add_fail(self, test_name: str, details: str):
        self.failed.append((test_name, details))
        print(f"{RED}✗ FAIL{RESET}: {test_name}")
        print(f"  {RED}{details}{RESET}")
    
    def add_warning(self, test_name: str, details: str):
        self.warnings.append((test_name, details))
        print(f"{YELLOW}⚠ WARNING{RESET}: {test_name}")
        print(f"  {details}")
    
    def summary(self):
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}TEST SUMMARY{RESET}")
        print(f"{BLUE}{'='*80}{RESET}")
        print(f"{GREEN}Passed: {len(self.passed)}{RESET}")
        print(f"{RED}Failed: {len(self.failed)}{RESET}")
        print(f"{YELLOW}Warnings: {len(self.warnings)}{RESET}")
        
        if self.failed:
            print(f"\n{RED}FAILED TESTS:{RESET}")
            for test_name, details in self.failed:
                print(f"  • {test_name}")
                print(f"    {details}")
        
        return len(self.failed) == 0

results = TestResults()

def login(email: str, password: str) -> Optional[Dict]:
    """Login and return token + user info"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return {
                "token": data.get("access_token"),
                "user": data.get("user")
            }
        else:
            print(f"{RED}Login failed for {email}: {response.status_code} - {response.text}{RESET}")
            return None
    except Exception as e:
        print(f"{RED}Login error for {email}: {str(e)}{RESET}")
        return None

def get_headers(token: str) -> Dict:
    """Get authorization headers"""
    return {"Authorization": f"Bearer {token}"}

def get_future_weekday(days_ahead: int = 14) -> date:
    """Get a future weekday (Mon-Fri)"""
    future_date = date.today() + timedelta(days=days_ahead)
    # Ensure it's a weekday
    while future_date.weekday() >= 5:  # 5=Sat, 6=Sun
        future_date += timedelta(days=1)
    return future_date

def test_1_get_vacations_as_admin(admin_token: str):
    """Test 1: GET /api/vacations as admin - should return ALL requests (>= 5)"""
    print(f"\n{BLUE}Test 1: GET /api/vacations as admin{RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations",
            headers=get_headers(admin_token),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if len(data) >= 5:
                results.add_pass(
                    "GET /api/vacations (admin)",
                    f"Returned {len(data)} requests (>= 5 expected)"
                )
                return data
            else:
                results.add_fail(
                    "GET /api/vacations (admin)",
                    f"Expected >= 5 requests, got {len(data)}"
                )
        else:
            results.add_fail(
                "GET /api/vacations (admin)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("GET /api/vacations (admin)", str(e))
    return []

def test_2_get_vacations_as_empleado(empleado_token: str):
    """Test 2: GET /api/vacations as empleado - should return ONLY own requests"""
    print(f"\n{BLUE}Test 2: GET /api/vacations as empleado{RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations",
            headers=get_headers(empleado_token),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            # Check all returned requests belong to empleado (employee_id="2")
            leaked = [r for r in data if r.get("employeeId") != EMPLEADO_EMPLOYEE_ID]
            if leaked:
                results.add_fail(
                    "GET /api/vacations (empleado) - data leak",
                    f"Found {len(leaked)} requests from other employees: {leaked}"
                )
            else:
                results.add_pass(
                    "GET /api/vacations (empleado)",
                    f"Returned {len(data)} requests, all belong to employee_id={EMPLEADO_EMPLOYEE_ID}"
                )
            return data
        else:
            results.add_fail(
                "GET /api/vacations (empleado)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("GET /api/vacations (empleado)", str(e))
    return []

def test_3_filter_by_status(admin_token: str):
    """Test 3: Filter by status=Pendiente"""
    print(f"\n{BLUE}Test 3: GET /api/vacations?status=Pendiente{RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations?status=Pendiente",
            headers=get_headers(admin_token),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            non_pending = [r for r in data if r.get("status") != "Pendiente"]
            if non_pending:
                results.add_fail(
                    "Filter by status=Pendiente",
                    f"Found {len(non_pending)} non-pending requests in results"
                )
            else:
                results.add_pass(
                    "Filter by status=Pendiente",
                    f"All {len(data)} requests have status=Pendiente"
                )
        else:
            results.add_fail(
                "Filter by status=Pendiente",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("Filter by status=Pendiente", str(e))

def test_4_filter_by_search(admin_token: str):
    """Test 4: Filter by search=Laura"""
    print(f"\n{BLUE}Test 4: GET /api/vacations?search=Laura{RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations?search=Laura",
            headers=get_headers(admin_token),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            non_laura = [r for r in data if "laura" not in (r.get("employeeName") or "").lower()]
            if non_laura:
                results.add_fail(
                    "Filter by search=Laura",
                    f"Found {len(non_laura)} non-Laura requests in results"
                )
            else:
                results.add_pass(
                    "Filter by search=Laura",
                    f"All {len(data)} requests belong to Laura"
                )
        else:
            results.add_fail(
                "Filter by search=Laura",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("Filter by search=Laura", str(e))

def test_5_get_balance_me_admin(admin_token: str):
    """Test 5: GET /api/vacations/balance/me as admin"""
    print(f"\n{BLUE}Test 5: GET /api/vacations/balance/me (admin){RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations/balance/me",
            headers=get_headers(admin_token),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("employeeId") == ADMIN_EMPLOYEE_ID and data.get("totalDays") == 12:
                results.add_pass(
                    "GET /api/vacations/balance/me (admin)",
                    f"Balance: totalDays={data.get('totalDays')}, daysUsed={data.get('daysUsed')}, daysAvailable={data.get('daysAvailable')}"
                )
                return data
            else:
                results.add_fail(
                    "GET /api/vacations/balance/me (admin)",
                    f"Expected employee_id={ADMIN_EMPLOYEE_ID} and totalDays=12, got {data}"
                )
        else:
            results.add_fail(
                "GET /api/vacations/balance/me (admin)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("GET /api/vacations/balance/me (admin)", str(e))
    return None

def test_6_get_balance_me_empleado(empleado_token: str):
    """Test 6: GET /api/vacations/balance/me as empleado"""
    print(f"\n{BLUE}Test 6: GET /api/vacations/balance/me (empleado){RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations/balance/me",
            headers=get_headers(empleado_token),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("employeeId") == EMPLEADO_EMPLOYEE_ID:
                results.add_pass(
                    "GET /api/vacations/balance/me (empleado)",
                    f"Balance: totalDays={data.get('totalDays')}, daysUsed={data.get('daysUsed')}, daysAvailable={data.get('daysAvailable')}"
                )
                return data
            else:
                results.add_fail(
                    "GET /api/vacations/balance/me (empleado)",
                    f"Expected employee_id={EMPLEADO_EMPLOYEE_ID}, got {data}"
                )
        else:
            results.add_fail(
                "GET /api/vacations/balance/me (empleado)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("GET /api/vacations/balance/me (empleado)", str(e))
    return None

def test_7_get_balances_admin(admin_token: str):
    """Test 7: GET /api/vacations/balances as admin - should return >= 8 entries"""
    print(f"\n{BLUE}Test 7: GET /api/vacations/balances (admin){RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations/balances",
            headers=get_headers(admin_token),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if len(data) >= 8:
                results.add_pass(
                    "GET /api/vacations/balances (admin)",
                    f"Returned {len(data)} balances (>= 8 expected)"
                )
            else:
                results.add_fail(
                    "GET /api/vacations/balances (admin)",
                    f"Expected >= 8 balances, got {len(data)}"
                )
        else:
            results.add_fail(
                "GET /api/vacations/balances (admin)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("GET /api/vacations/balances (admin)", str(e))

def test_8_get_balances_empleado(empleado_token: str):
    """Test 8: GET /api/vacations/balances as empleado - should return 403"""
    print(f"\n{BLUE}Test 8: GET /api/vacations/balances (empleado) - expect 403{RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations/balances",
            headers=get_headers(empleado_token),
            timeout=10
        )
        if response.status_code == 403:
            results.add_pass(
                "GET /api/vacations/balances (empleado)",
                "Correctly returned 403 Forbidden"
            )
        else:
            results.add_fail(
                "GET /api/vacations/balances (empleado)",
                f"Expected 403, got {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("GET /api/vacations/balances (empleado)", str(e))

def test_9_get_balance_by_id_admin(admin_token: str):
    """Test 9: GET /api/vacations/balance/{employee_id} as admin"""
    print(f"\n{BLUE}Test 9: GET /api/vacations/balance/2 (admin){RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations/balance/2",
            headers=get_headers(admin_token),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("employeeId") == "2":
                results.add_pass(
                    "GET /api/vacations/balance/{employee_id} (admin)",
                    f"Admin can fetch employee_id=2 balance"
                )
            else:
                results.add_fail(
                    "GET /api/vacations/balance/{employee_id} (admin)",
                    f"Expected employee_id=2, got {data}"
                )
        else:
            results.add_fail(
                "GET /api/vacations/balance/{employee_id} (admin)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("GET /api/vacations/balance/{employee_id} (admin)", str(e))

def test_10_get_balance_by_id_empleado_own(empleado_token: str):
    """Test 10: GET /api/vacations/balance/{employee_id} as empleado (own ID)"""
    print(f"\n{BLUE}Test 10: GET /api/vacations/balance/2 (empleado own){RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations/balance/{EMPLEADO_EMPLOYEE_ID}",
            headers=get_headers(empleado_token),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            results.add_pass(
                "GET /api/vacations/balance/{employee_id} (empleado own)",
                "Empleado can fetch own balance"
            )
        else:
            results.add_fail(
                "GET /api/vacations/balance/{employee_id} (empleado own)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("GET /api/vacations/balance/{employee_id} (empleado own)", str(e))

def test_11_get_balance_by_id_empleado_other(empleado_token: str):
    """Test 11: GET /api/vacations/balance/{employee_id} as empleado (other ID) - expect 403"""
    print(f"\n{BLUE}Test 11: GET /api/vacations/balance/1 (empleado other) - expect 403{RESET}")
    try:
        response = requests.get(
            f"{BASE_URL}/vacations/balance/1",
            headers=get_headers(empleado_token),
            timeout=10
        )
        if response.status_code == 403:
            results.add_pass(
                "GET /api/vacations/balance/{employee_id} (empleado other)",
                "Correctly returned 403 Forbidden"
            )
        else:
            results.add_fail(
                "GET /api/vacations/balance/{employee_id} (empleado other)",
                f"Expected 403, got {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("GET /api/vacations/balance/{employee_id} (empleado other)", str(e))

def test_12_create_valid_request(empleado_token: str):
    """Test 12: POST /api/vacations - valid creation"""
    print(f"\n{BLUE}Test 12: POST /api/vacations (valid){RESET}")
    try:
        start_date = get_future_weekday(14)
        end_date = start_date + timedelta(days=2)  # 3 calendar days
        
        payload = {
            "type": "Vacaciones",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "reason": "Test vacation request"
        }
        
        response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(empleado_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("status") == "Pendiente" and 
                data.get("type") == "Vacaciones" and
                data.get("totalDays") > 0):
                results.add_pass(
                    "POST /api/vacations (valid)",
                    f"Created request: id={data.get('id')}, totalDays={data.get('totalDays')}, returnDate={data.get('returnDate')}"
                )
                return data
            else:
                results.add_fail(
                    "POST /api/vacations (valid)",
                    f"Unexpected response data: {data}"
                )
        else:
            results.add_fail(
                "POST /api/vacations (valid)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("POST /api/vacations (valid)", str(e))
    return None

def test_13_create_past_date(empleado_token: str):
    """Test 13: POST /api/vacations - past date should return 400"""
    print(f"\n{BLUE}Test 13: POST /api/vacations (past date) - expect 400{RESET}")
    try:
        past_date = date.today() - timedelta(days=5)
        
        payload = {
            "type": "Vacaciones",
            "startDate": past_date.strftime("%Y-%m-%d"),
            "endDate": past_date.strftime("%Y-%m-%d"),
            "reason": "Test past date"
        }
        
        response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(empleado_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 400:
            results.add_pass(
                "POST /api/vacations (past date)",
                "Correctly rejected past date with 400"
            )
        else:
            results.add_fail(
                "POST /api/vacations (past date)",
                f"Expected 400, got {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("POST /api/vacations (past date)", str(e))

def test_14_create_invalid_date_range(empleado_token: str):
    """Test 14: POST /api/vacations - endDate < startDate should return 400"""
    print(f"\n{BLUE}Test 14: POST /api/vacations (endDate < startDate) - expect 400{RESET}")
    try:
        start_date = get_future_weekday(14)
        end_date = start_date - timedelta(days=2)
        
        payload = {
            "type": "Vacaciones",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "reason": "Test invalid range"
        }
        
        response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(empleado_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 400:
            results.add_pass(
                "POST /api/vacations (invalid range)",
                "Correctly rejected endDate < startDate with 400"
            )
        else:
            results.add_fail(
                "POST /api/vacations (invalid range)",
                f"Expected 400, got {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("POST /api/vacations (invalid range)", str(e))

def test_15_create_insufficient_balance(empleado_token: str):
    """Test 15: POST /api/vacations - insufficient balance should return 400"""
    print(f"\n{BLUE}Test 15: POST /api/vacations (insufficient balance) - expect 400{RESET}")
    try:
        start_date = get_future_weekday(14)
        end_date = start_date + timedelta(days=20)  # Request >12 business days
        
        payload = {
            "type": "Vacaciones",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "reason": "Test insufficient balance"
        }
        
        response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(empleado_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 400 and "saldo" in response.text.lower():
            results.add_pass(
                "POST /api/vacations (insufficient balance)",
                "Correctly rejected insufficient balance with 400"
            )
        else:
            results.add_fail(
                "POST /api/vacations (insufficient balance)",
                f"Expected 400 with balance error, got {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("POST /api/vacations (insufficient balance)", str(e))

def test_16_create_as_admin_for_other(admin_token: str):
    """Test 16: POST /api/vacations as admin specifying employeeId"""
    print(f"\n{BLUE}Test 16: POST /api/vacations (admin for other employee){RESET}")
    try:
        start_date = get_future_weekday(14)
        end_date = start_date + timedelta(days=1)
        
        payload = {
            "employeeId": "3",  # Laura
            "type": "Vacaciones",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "reason": "Admin creating for employee"
        }
        
        response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(admin_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("employeeId") == "3":
                results.add_pass(
                    "POST /api/vacations (admin for other)",
                    f"Admin created request for employee_id=3"
                )
                return data
            else:
                results.add_fail(
                    "POST /api/vacations (admin for other)",
                    f"Expected employeeId=3, got {data}"
                )
        else:
            results.add_fail(
                "POST /api/vacations (admin for other)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("POST /api/vacations (admin for other)", str(e))
    return None

def test_17_update_status_empleado(empleado_token: str, request_id: str):
    """Test 17: PATCH /api/vacations/{id}/status as empleado - expect 403"""
    print(f"\n{BLUE}Test 17: PATCH /api/vacations/{request_id}/status (empleado) - expect 403{RESET}")
    try:
        payload = {
            "status": "Aprobado",
            "adminComment": "Test"
        }
        
        response = requests.patch(
            f"{BASE_URL}/vacations/{request_id}/status",
            headers=get_headers(empleado_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 403:
            results.add_pass(
                "PATCH /api/vacations/{id}/status (empleado)",
                "Correctly returned 403 Forbidden"
            )
        else:
            results.add_fail(
                "PATCH /api/vacations/{id}/status (empleado)",
                f"Expected 403, got {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("PATCH /api/vacations/{id}/status (empleado)", str(e))

def test_18_update_status_admin_aprobado(admin_token: str, request_id: str, employee_id: str):
    """Test 18: PATCH /api/vacations/{id}/status as admin - Aprobado"""
    print(f"\n{BLUE}Test 18: PATCH /api/vacations/{request_id}/status (admin Aprobado){RESET}")
    try:
        # Get balance before
        balance_before = requests.get(
            f"{BASE_URL}/vacations/balance/{employee_id}",
            headers=get_headers(admin_token),
            timeout=10
        ).json()
        
        payload = {
            "status": "Aprobado",
            "adminComment": "Approved for testing"
        }
        
        response = requests.patch(
            f"{BASE_URL}/vacations/{request_id}/status",
            headers=get_headers(admin_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "Aprobado":
                # Check balance after
                balance_after = requests.get(
                    f"{BASE_URL}/vacations/balance/{employee_id}",
                    headers=get_headers(admin_token),
                    timeout=10
                ).json()
                
                days_used_before = balance_before.get("daysUsed", 0)
                days_used_after = balance_after.get("daysUsed", 0)
                total_days = data.get("totalDays", 0)
                
                if days_used_after > days_used_before:
                    results.add_pass(
                        "PATCH /api/vacations/{id}/status (Aprobado)",
                        f"Status updated to Aprobado, daysUsed increased from {days_used_before} to {days_used_after}"
                    )
                else:
                    results.add_fail(
                        "PATCH /api/vacations/{id}/status (Aprobado)",
                        f"daysUsed should increase after Aprobado. Before: {days_used_before}, After: {days_used_after}"
                    )
            else:
                results.add_fail(
                    "PATCH /api/vacations/{id}/status (Aprobado)",
                    f"Expected status=Aprobado, got {data}"
                )
        else:
            results.add_fail(
                "PATCH /api/vacations/{id}/status (Aprobado)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("PATCH /api/vacations/{id}/status (Aprobado)", str(e))

def test_19_update_status_admin_justificado(admin_token: str):
    """Test 19: PATCH /api/vacations/{id}/status as admin - Justificado (should NOT affect daysUsed)"""
    print(f"\n{BLUE}Test 19: PATCH status to Justificado (should NOT affect daysUsed){RESET}")
    try:
        # Create a new Vacaciones request first
        start_date = get_future_weekday(20)
        end_date = start_date + timedelta(days=1)
        
        create_payload = {
            "employeeId": "4",  # Carlos
            "type": "Vacaciones",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "reason": "Test Justificado"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(admin_token),
            json=create_payload,
            timeout=10
        )
        
        if create_response.status_code != 200:
            results.add_fail(
                "PATCH status to Justificado",
                f"Failed to create test request: {create_response.status_code}"
            )
            return
        
        request_id = create_response.json().get("id")
        employee_id = "4"
        
        # Get balance before
        balance_before = requests.get(
            f"{BASE_URL}/vacations/balance/{employee_id}",
            headers=get_headers(admin_token),
            timeout=10
        ).json()
        
        # Update to Justificado
        payload = {
            "status": "Justificado",
            "adminComment": "Justified for testing"
        }
        
        response = requests.patch(
            f"{BASE_URL}/vacations/{request_id}/status",
            headers=get_headers(admin_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            # Check balance after
            balance_after = requests.get(
                f"{BASE_URL}/vacations/balance/{employee_id}",
                headers=get_headers(admin_token),
                timeout=10
            ).json()
            
            days_used_before = balance_before.get("daysUsed", 0)
            days_used_after = balance_after.get("daysUsed", 0)
            
            if days_used_after == days_used_before:
                results.add_pass(
                    "PATCH status to Justificado",
                    f"Status updated to Justificado, daysUsed unchanged ({days_used_before})"
                )
            else:
                results.add_fail(
                    "PATCH status to Justificado",
                    f"daysUsed should NOT change for Justificado. Before: {days_used_before}, After: {days_used_after}"
                )
        else:
            results.add_fail(
                "PATCH status to Justificado",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("PATCH status to Justificado", str(e))

def test_20_delete_empleado_own_pending(empleado_token: str):
    """Test 20: DELETE /api/vacations/{id} - empleado can delete own pending"""
    print(f"\n{BLUE}Test 20: DELETE own pending request (empleado){RESET}")
    try:
        # Create a pending request first
        start_date = get_future_weekday(25)
        end_date = start_date + timedelta(days=1)
        
        create_payload = {
            "type": "Vacaciones",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "reason": "Test delete"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(empleado_token),
            json=create_payload,
            timeout=10
        )
        
        if create_response.status_code != 200:
            results.add_fail(
                "DELETE own pending (empleado)",
                f"Failed to create test request: {create_response.status_code}"
            )
            return
        
        request_id = create_response.json().get("id")
        
        # Delete it
        response = requests.delete(
            f"{BASE_URL}/vacations/{request_id}",
            headers=get_headers(empleado_token),
            timeout=10
        )
        
        if response.status_code == 200:
            results.add_pass(
                "DELETE own pending (empleado)",
                "Successfully deleted own pending request"
            )
        else:
            results.add_fail(
                "DELETE own pending (empleado)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("DELETE own pending (empleado)", str(e))

def test_21_delete_empleado_approved(empleado_token: str, admin_token: str):
    """Test 21: DELETE /api/vacations/{id} - empleado cannot delete approved"""
    print(f"\n{BLUE}Test 21: DELETE approved request (empleado) - expect 400{RESET}")
    try:
        # Create and approve a request
        start_date = get_future_weekday(30)
        end_date = start_date + timedelta(days=1)
        
        create_payload = {
            "type": "Vacaciones",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "reason": "Test delete approved"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(empleado_token),
            json=create_payload,
            timeout=10
        )
        
        if create_response.status_code != 200:
            results.add_fail(
                "DELETE approved (empleado)",
                f"Failed to create test request: {create_response.status_code}"
            )
            return
        
        request_id = create_response.json().get("id")
        
        # Approve it as admin
        approve_payload = {
            "status": "Aprobado",
            "adminComment": "Approved for delete test"
        }
        
        requests.patch(
            f"{BASE_URL}/vacations/{request_id}/status",
            headers=get_headers(admin_token),
            json=approve_payload,
            timeout=10
        )
        
        # Try to delete as empleado
        response = requests.delete(
            f"{BASE_URL}/vacations/{request_id}",
            headers=get_headers(empleado_token),
            timeout=10
        )
        
        if response.status_code == 400:
            results.add_pass(
                "DELETE approved (empleado)",
                "Correctly rejected deletion of approved request with 400"
            )
        else:
            results.add_fail(
                "DELETE approved (empleado)",
                f"Expected 400, got {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("DELETE approved (empleado)", str(e))

def test_22_delete_empleado_other(empleado_token: str, admin_token: str):
    """Test 22: DELETE /api/vacations/{id} - empleado cannot delete other's request"""
    print(f"\n{BLUE}Test 22: DELETE other employee's request (empleado) - expect 403{RESET}")
    try:
        # Create a request as admin for another employee
        start_date = get_future_weekday(35)
        end_date = start_date + timedelta(days=1)
        
        create_payload = {
            "employeeId": "5",  # Ana
            "type": "Vacaciones",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "reason": "Test delete other"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(admin_token),
            json=create_payload,
            timeout=10
        )
        
        if create_response.status_code != 200:
            results.add_fail(
                "DELETE other's request (empleado)",
                f"Failed to create test request: {create_response.status_code}"
            )
            return
        
        request_id = create_response.json().get("id")
        
        # Try to delete as empleado (juan, employee_id=2)
        response = requests.delete(
            f"{BASE_URL}/vacations/{request_id}",
            headers=get_headers(empleado_token),
            timeout=10
        )
        
        if response.status_code == 403:
            results.add_pass(
                "DELETE other's request (empleado)",
                "Correctly rejected deletion of other's request with 403"
            )
        else:
            results.add_fail(
                "DELETE other's request (empleado)",
                f"Expected 403, got {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("DELETE other's request (empleado)", str(e))

def test_23_delete_admin_any(admin_token: str):
    """Test 23: DELETE /api/vacations/{id} - admin can delete any request"""
    print(f"\n{BLUE}Test 23: DELETE any request (admin){RESET}")
    try:
        # Create a request for another employee
        start_date = get_future_weekday(40)
        end_date = start_date + timedelta(days=1)
        
        create_payload = {
            "employeeId": "6",  # Roberto
            "type": "Vacaciones",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "reason": "Test admin delete"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(admin_token),
            json=create_payload,
            timeout=10
        )
        
        if create_response.status_code != 200:
            results.add_fail(
                "DELETE any request (admin)",
                f"Failed to create test request: {create_response.status_code}"
            )
            return
        
        request_id = create_response.json().get("id")
        
        # Delete as admin
        response = requests.delete(
            f"{BASE_URL}/vacations/{request_id}",
            headers=get_headers(admin_token),
            timeout=10
        )
        
        if response.status_code == 200:
            results.add_pass(
                "DELETE any request (admin)",
                "Admin successfully deleted any request"
            )
        else:
            results.add_fail(
                "DELETE any request (admin)",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("DELETE any request (admin)", str(e))

def test_24_edge_case_weekend_exclusion(empleado_token: str):
    """Test 24: Edge case - totalDays excludes weekends (Fri-Mon = 2 days)"""
    print(f"\n{BLUE}Test 24: Edge case - weekend exclusion (Fri-Mon){RESET}")
    try:
        # Find next Friday
        today = date.today()
        days_ahead = (4 - today.weekday()) % 7  # 4 = Friday
        if days_ahead == 0:
            days_ahead = 7
        friday = today + timedelta(days=days_ahead + 7)  # Next Friday
        monday = friday + timedelta(days=3)  # Following Monday
        
        payload = {
            "type": "Vacaciones",
            "startDate": friday.strftime("%Y-%m-%d"),
            "endDate": monday.strftime("%Y-%m-%d"),
            "reason": "Test weekend exclusion"
        }
        
        response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(empleado_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            total_days = data.get("totalDays")
            if total_days == 2:
                results.add_pass(
                    "Edge case - weekend exclusion",
                    f"Fri-Mon correctly calculated as {total_days} business days"
                )
            else:
                results.add_fail(
                    "Edge case - weekend exclusion",
                    f"Expected 2 business days (Fri+Mon), got {total_days}"
                )
        else:
            results.add_fail(
                "Edge case - weekend exclusion",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("Edge case - weekend exclusion", str(e))

def test_25_edge_case_return_date_weekend(empleado_token: str):
    """Test 25: Edge case - returnDate skips weekends (endDate=Fri -> returnDate=Mon)"""
    print(f"\n{BLUE}Test 25: Edge case - returnDate skips weekends{RESET}")
    try:
        # Find next Friday
        today = date.today()
        days_ahead = (4 - today.weekday()) % 7  # 4 = Friday
        if days_ahead == 0:
            days_ahead = 7
        friday = today + timedelta(days=days_ahead + 7)
        
        payload = {
            "type": "Vacaciones",
            "startDate": friday.strftime("%Y-%m-%d"),
            "endDate": friday.strftime("%Y-%m-%d"),
            "reason": "Test return date"
        }
        
        response = requests.post(
            f"{BASE_URL}/vacations",
            headers=get_headers(empleado_token),
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return_date_str = data.get("returnDate")
            return_date = date.fromisoformat(return_date_str) if return_date_str else None
            expected_monday = friday + timedelta(days=3)
            
            if return_date == expected_monday and return_date.weekday() == 0:
                results.add_pass(
                    "Edge case - returnDate skips weekends",
                    f"endDate=Friday, returnDate={return_date.strftime('%Y-%m-%d')} (Monday)"
                )
            else:
                results.add_fail(
                    "Edge case - returnDate skips weekends",
                    f"Expected returnDate={expected_monday.strftime('%Y-%m-%d')} (Monday), got {data.get('returnDate')}"
                )
        else:
            results.add_fail(
                "Edge case - returnDate skips weekends",
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_fail("Edge case - returnDate skips weekends", str(e))

def main():
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}VACATIONS MODULE API TESTING{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Testing ONLY /api/vacations endpoints\n")
    
    # Login
    print(f"{BLUE}Logging in...{RESET}")
    admin_auth = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    empleado_auth = login(EMPLEADO_EMAIL, EMPLEADO_PASSWORD)
    
    if not admin_auth or not empleado_auth:
        print(f"{RED}Failed to login. Cannot proceed with tests.{RESET}")
        return 1
    
    admin_token = admin_auth["token"]
    empleado_token = empleado_auth["token"]
    
    print(f"{GREEN}✓ Logged in as admin (maria) and empleado (juan){RESET}\n")
    
    # Run tests
    all_requests = test_1_get_vacations_as_admin(admin_token)
    test_2_get_vacations_as_empleado(empleado_token)
    test_3_filter_by_status(admin_token)
    test_4_filter_by_search(admin_token)
    test_5_get_balance_me_admin(admin_token)
    test_6_get_balance_me_empleado(empleado_token)
    test_7_get_balances_admin(admin_token)
    test_8_get_balances_empleado(empleado_token)
    test_9_get_balance_by_id_admin(admin_token)
    test_10_get_balance_by_id_empleado_own(empleado_token)
    test_11_get_balance_by_id_empleado_other(empleado_token)
    
    # Create tests
    created_request = test_12_create_valid_request(empleado_token)
    test_13_create_past_date(empleado_token)
    test_14_create_invalid_date_range(empleado_token)
    test_15_create_insufficient_balance(empleado_token)
    admin_created = test_16_create_as_admin_for_other(admin_token)
    
    # Status update tests
    if created_request:
        test_17_update_status_empleado(empleado_token, created_request["id"])
        test_18_update_status_admin_aprobado(admin_token, created_request["id"], created_request["employeeId"])
    
    test_19_update_status_admin_justificado(admin_token)
    
    # Delete tests
    test_20_delete_empleado_own_pending(empleado_token)
    test_21_delete_empleado_approved(empleado_token, admin_token)
    test_22_delete_empleado_other(empleado_token, admin_token)
    test_23_delete_admin_any(admin_token)
    
    # Edge cases
    test_24_edge_case_weekend_exclusion(empleado_token)
    test_25_edge_case_return_date_weekend(empleado_token)
    
    # Summary
    success = results.summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
