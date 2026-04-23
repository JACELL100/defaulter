import uuid

import requests
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from .models import UserProfile


class SupabaseAuthentication(authentication.BaseAuthentication):
    """Authenticates API requests against Supabase Auth tokens."""

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode("utf-8")

        if not auth_header or not auth_header.lower().startswith("bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            raise AuthenticationFailed("Invalid bearer token.")

        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            raise AuthenticationFailed("Supabase auth settings are missing.")

        try:
            response = requests.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.SUPABASE_ANON_KEY,
                },
                timeout=10,
            )
        except requests.RequestException as exc:
            raise AuthenticationFailed("Supabase auth service unreachable.") from exc

        if response.status_code != 200:
            raise AuthenticationFailed("Invalid or expired access token.")

        payload = response.json()
        auth_user_id = payload.get("id")
        email = payload.get("email")
        metadata = payload.get("user_metadata") or {}

        if not auth_user_id or not email:
            raise AuthenticationFailed("Supabase token is missing user identity fields.")

        try:
            auth_uuid = uuid.UUID(auth_user_id)
        except ValueError as exc:
            raise AuthenticationFailed("Supabase user id has invalid UUID format.") from exc

        default_name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0]

        default_role = UserProfile.Role.STUDENT
        if not UserProfile.objects.exists():
            default_role = UserProfile.Role.ADMIN

        profile, _ = UserProfile.objects.get_or_create(
            auth_user_id=auth_uuid,
            defaults={
                "email": email,
                "full_name": default_name,
                "role": default_role,
            },
        )

        # Keep profile email in sync with auth provider changes.
        # Note: full_name is NOT synced so manual edits (e.g. admin rename) are preserved.
        if profile.email != email:
            profile.email = email
            profile.save(update_fields=["email", "updated_at"])

        return (profile, token)