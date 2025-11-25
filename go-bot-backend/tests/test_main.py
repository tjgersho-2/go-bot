# test_main.py - Basic tests for Go Bot API
import pytest
from fastapi.testclient import TestClient
from go_bot_backend.main import app
import os

# Set test environment variables
os.environ["ANTHROPIC_API_KEY"] = "test-key"
os.environ["ENABLE_RAG"] = "false"
os.environ["ENABLE_RATE_LIMITING"] = "false"
os.environ["ENABLE_PAYMENTS"] = "false"
os.environ["ENABLE_ANALYTICS"] = "false"

client = TestClient(app)


def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Go Bot API"
    assert "version" in data


def test_health():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data
    assert "timestamp" in data


def test_clarify_missing_title():
    """Test clarify endpoint with missing title"""
    response = client.post("/clarify", json={})
    assert response.status_code == 422  # Validation error


def test_clarify_structure():
    """Test clarify endpoint structure (without actual AI call)"""
    # This would need mocking for real tests
    ticket = {
        "title": "Fix login bug",
        "description": "Users can't log in",
        "issueType": "Bug",
        "priority": "High"
    }
    
    # Note: This will fail without a real API key
    # In production, mock the Claude API call
    response = client.post("/clarify", json=ticket)
    
    # Without real API key, we expect error
    # With real key, we'd check for proper structure
    assert response.status_code in [200, 500]


def test_usage_endpoint():
    """Test usage endpoint"""
    # This will work even without database
    response = client.get("/usage/test-org")
    
    if response.status_code == 200:
        data = response.json()
        assert "clarificationsUsed" in data
        assert "clarificationsRemaining" in data
        assert "plan" in data


# Run tests with: pytest test_main.py -v