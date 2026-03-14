from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from a_apis.models import Session
from django.contrib.auth import login, logout, authenticate

def web_login(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            return render(request, 'a_web/auth.html', {'error': 'Invalid credentials'})
    return redirect('index')

def index(request):
    if request.user.is_authenticated:
        return render(request, 'a_web/dashboard.html', {'active_tab': 'sessions', 'sessions': Session.objects.filter(user=request.user).order_by('-createdAt')})
    return render(request, 'a_web/auth.html')

@login_required
def sessions_view(request):
    sessions = Session.objects.filter(user=request.user).order_by('-createdAt')
    if request.htmx:
        return render(request, 'a_web/partials/sessions_list.html', {'sessions': sessions})
    return render(request, 'a_web/dashboard.html', {'active_tab': 'sessions', 'sessions': sessions})

@login_required
def create_session_view(request):
    if request.method == 'POST':
        import time
        from django.conf import settings
        import requests
        
        session_id = f"sess_{int(time.time() * 1000)}"
        session = Session.objects.create(
            id=session_id,
            user=request.user,
            status='INIT'
        )
        
        try:
            requests.post(f"{settings.WORKER_URL}/sessions/start", json={
                "sessionId": session_id,
                "userId": str(request.user.id)
            }, timeout=1)
        except:
            pass
            
        return render(request, 'a_web/partials/session_card.html', {'session': session})

@login_required
def delete_session_view(request, pk):
    if request.method == 'DELETE':
        from django.conf import settings
        import requests
        try:
            session = Session.objects.get(id=pk, user=request.user)
            try:
                requests.delete(f"{settings.WORKER_URL}/sessions/{pk}", timeout=1)
            except:
                pass
            session.delete()
            return HttpResponse("") 
        except Session.DoesNotExist:
            return HttpResponse(status=404)

@login_required
def docs_view(request):
    if request.htmx:
        return render(request, 'a_web/partials/docs.html')
    return render(request, 'a_web/dashboard.html', {'active_tab': 'docs'})

@login_required
def update_webhook_view(request, pk):
    if request.method == 'POST':
        from django.conf import settings
        import requests
        webhook_url = request.POST.get('webhookUrl')
        try:
            session = Session.objects.get(id=pk, user=request.user)
            session.webhookUrl = webhook_url
            session.save()
            try:
                requests.patch(f"{settings.WORKER_URL}/sessions/webhook", json={
                    "sessionId": pk,
                    "webhookUrl": webhook_url
                }, timeout=1)
            except:
                pass
            return render(request, 'a_web/partials/session_card.html', {'session': session})
        except Session.DoesNotExist:
            return HttpResponse(status=404)

def auth_logout(request):
    logout(request)
    return redirect('index')
