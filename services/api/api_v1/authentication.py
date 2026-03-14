from rest_framework import authentication
from rest_framework import exceptions
from .models import Session

class ApiKeyAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        if not auth_header.startswith('Bearer '):
            return None

        api_key = auth_header.split(' ')[1]
        try:
            session = Session.objects.get(apiKey=api_key)
        except Session.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid API Key')

        # We return a tuple of (user, auth)
        # For external API calls, we return the session owner
        return (session.user, session)
