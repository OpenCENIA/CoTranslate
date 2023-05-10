from rest_framework import serializers
from .models import Profile, Skill, Campaign, CampaignItem, CampaignItemAnswer

# Auth imports
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class ProfileSerializer(serializers.ModelSerializer):
    user = serializers.CharField()

    class Meta:
        model = Profile
        fields = ('id', 'user', 'role', 'skills')


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ('id', 'title', 'description')


class CampaignItemSerializer(serializers.ModelSerializer):
    campaign = serializers.CharField()

    class Meta:
        model = CampaignItem
        fields = ('id', 'originalItem', 'translatedItem', 'comments', 'campaign', 'status', 'assignedTagger', 'assignedTranslator')


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ('id', 'title', 'owner', 'isNllb', 'description', 'completed',
                  'requiredSkills', 'assignedTranslators', 'assignedTaggers', 'taggersPerValidation', 'validationThreshold', 'campaignType', 'originalLanguage', 'targetLanguage')


class CampaignItemAnswerSerializer(serializers.ModelSerializer):
    # tagger = serializers.CharField()
    type = serializers.CharField()

    class Meta:
        model = CampaignItemAnswer
        fields = ('id', 'profile', 'campaignItem', 'campaign', 'type', 'cycle', 'translationQuality', 'comment', 'translation', 'answerTime')


# Auth serializers


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        profile = Profile.objects.get(pk=user.id)
        token['role'] = profile.ROLE_CHOICES[profile.role - 1][1]
        # token['skills'] = ",".join([skill.title for skill in profile.skills.all()])
        token['skills'] = [SkillSerializer(skill).data
                           for skill in profile.skills.all()]

        profile_serializer = ProfileSerializer(profile)
        token['profile'] = profile_serializer.data

        # ...
        return token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})

        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username']
        )

        user.set_password(validated_data['password'])
        user.save()

        return user
