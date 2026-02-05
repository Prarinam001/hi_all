from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict
import models, schemas, auth, database
from database import engine
import datetime

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth Routes
@app.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name, phone_number=user.phone_number)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users/search", response_model=schemas.UserResponse)
def search_user(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # User not found, "send invite" logic
        # Mocking sending email
        print(f"Sending invite to {email}")
        raise HTTPException(status_code=404, detail="User not found, invite sent")
    return user

@app.get("/conversations", response_model=List[schemas.ConversationResponse])
def get_conversations(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = db.query(models.Conversation).filter(
        models.Conversation.user_id == current_user.id
    ).order_by(models.Conversation.last_message_time.desc()).all()
    
    # Enrich conversations with other user details
    result = []
    for conv in conversations:
        other_user = db.query(models.User).filter(models.User.id == conv.other_user_id).first()
        conv_dict = {
            'id': conv.id,
            'other_user_id': conv.other_user_id,
            'last_message': conv.last_message,
            'last_message_time': conv.last_message_time,
            'created_at': conv.created_at,
            'other_user_name': other_user.full_name if other_user else f'User {conv.other_user_id}',
            'other_user_email': other_user.email if other_user else ''
        }
        result.append(conv_dict)
    
    return result

@app.post("/conversations")
def create_or_update_conversation(
    conv_data: schemas.ConversationCreate,
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Check if conversation exists
    conversation = db.query(models.Conversation).filter(
        models.Conversation.user_id == current_user.id,
        models.Conversation.other_user_id == conv_data.other_user_id
    ).first()
    
    if conversation:
        # Update existing conversation
        conversation.id = conv_data.other_user_id
        conversation.last_message = conv_data.last_message
        conversation.last_message_time = datetime.datetime.utcnow()
    else:
        # Create new conversation
        conversation = models.Conversation(
            user_id=current_user.id,
            other_user_id=conv_data.other_user_id,
            last_message=conv_data.last_message,
            last_message_time=datetime.datetime.utcnow()
        )
        db.add(conversation)
    
    db.commit()
    db.refresh(conversation)
    return conversation

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        # Maps user_id to websocket
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle signaling or chat messages here
            # For simplicity, we just echo for now or assume format is JSON
            # In real app, parse data: {type: 'chat'|'signal', target: target_id, payload: ...}
            import json
            try:
                msg_data = json.loads(data)
                target_id = msg_data.get("target_id")
                if target_id:
                    await manager.send_personal_message(json.dumps(msg_data), int(target_id))
            except Exception as e:
                print(f"Error: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
