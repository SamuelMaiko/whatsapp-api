from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings
from .models import User, Session
from .serializers import UserSerializer, SessionSerializer
from .authentication import ApiKeyAuthentication
import requests
import time

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "success": True,
                "message": "User created successfully"
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(email=email, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            "success": True,
            "token": str(refresh.access_token),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name
            }
        })
    return Response({"success": False, "error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Session.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        session_id = f"sess_{int(time.time() * 1000)}"
        session = Session.objects.create(
            id=session_id,
            user=request.user,
            status='INIT'
        )
        
        # Notify worker
        try:
            requests.post(f"{settings.WORKER_URL}/sessions/start", json={
                "sessionId": session_id,
                "userId": str(request.user.id)
            }, timeout=2)
        except Exception as e:
            print(f"Worker notify failed: {e}")

        serializer = self.get_serializer(session)
        return Response({"success": True, "session": serializer.data}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['patch'], url_path='webhook')
    def update_webhook(self, request):
        session_id = request.data.get('sessionId')
        webhook_url = request.data.get('webhookUrl')
        
        try:
            session = Session.objects.get(id=session_id, user=request.user)
            session.webhookUrl = webhook_url
            session.save()
            
            # Notify worker
            try:
                requests.patch(f"{settings.WORKER_URL}/sessions/webhook", json={
                    "sessionId": session_id,
                    "webhookUrl": webhook_url
                }, timeout=2)
            except Exception as e:
                print(f"Worker notify failed: {e}")
                
            return Response({"success": True})
        except Session.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        session_id = instance.id
        
        # Notify worker
        try:
            requests.delete(f"{settings.WORKER_URL}/sessions/{session_id}", timeout=2)
        except Exception as e:
            print(f"Worker notify failed: {e}")
            
        self.perform_destroy(instance)
        return Response({"success": True}, status=status.HTTP_200_OK)

@api_view(['POST'])
@authentication_classes([ApiKeyAuthentication])
@permission_classes([IsAuthenticated])
def send_message_view(request):
    to = request.data.get('to')
    message = request.data.get('message')
    # session object is attached by auth class as request.auth
    session = request.auth
    
    try:
        res = requests.post(f"{settings.WORKER_URL}/messaging/send-message", json={
            "sessionId": session.id,
            "to": to,
            "message": message
        })
        return Response(res.json())
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([ApiKeyAuthentication])
@permission_classes([IsAuthenticated])
def send_image_view(request):
    to = request.data.get('to')
    url = request.data.get('url')
    caption = request.data.get('caption')
    session = request.auth
    
    try:
        res = requests.post(f"{settings.WORKER_URL}/messaging/send-image", json={
            "sessionId": session.id,
            "to": to,
            "url": url,
            "caption": caption
        })
        return Response(res.json())
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# View for serving the portal
from django.shortcuts import render
def portal_view(request):
    return render(request, 'index.html')
