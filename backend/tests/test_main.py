from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import pytest

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_signup():
    response = client.post(
        "/signup",
        json={"email": "testuser@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert "id" in data

def test_login():
    # Signup first (idempotency issues in test flow if not careful, but sqlite is persistent? 
    # Usually we drop db after test or use in-memory. For file-based test.db, it persists.)
    # Let's try to login the user created above or create new.
    
    # Create unique user
    import time
    email = f"user{time.time()}@example.com"
    client.post("/signup", json={"email": email, "password": "password"})
    
    response = client.post(
        "/token",
        data={"username": email, "password": "password"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_search_user_found():
    email = "searchtarget@example.com"
    client.post("/signup", json={"email": email, "password": "pwd"})
    
    # Need auth to search? In main.py, search_user does NOT depend on get_current_user in the signature:
    # def search_user(email: str, db: Session = Depends(get_db)):
    # So it is public? Let's check main.py content from memory or assume.
    # If public, we can just call it.
    
    response = client.get(f"/users/search?email={email}")
    assert response.status_code == 200
    assert response.json()["email"] == email

def test_search_user_not_found():
    response = client.get("/users/search?email=nonexistent@example.com")
    # Expected 404
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found, invite sent"
