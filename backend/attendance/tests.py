import uuid

from django.test import TestCase
from rest_framework.permissions import IsAuthenticated
from rest_framework.test import APIRequestFactory

from .models import UserProfile


class UserProfileAuthCompatibilityTests(TestCase):
	def test_userprofile_matches_drf_authenticated_contract(self):
		profile = UserProfile.objects.create(
			auth_user_id=uuid.uuid4(),
			email="student@example.com",
			full_name="Test Student",
			role=UserProfile.Role.STUDENT,
		)

		request = APIRequestFactory().get("/api/auth/me/")
		request.user = profile

		self.assertTrue(profile.is_authenticated)
		self.assertFalse(profile.is_anonymous)
		self.assertTrue(IsAuthenticated().has_permission(request, view=None))
