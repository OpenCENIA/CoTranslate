from django.db import models
from django.contrib.auth.models import AbstractUser, User
from django.db.models.signals import post_save
from django.dispatch import receiver

# Create your models here

class Skill(models.Model):
    title = models.CharField(max_length=120)
    description = models.TextField()

    def __str__(self):
        return self.title


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    TAGGER = 1
    MANAGER = 2

    ROLE_CHOICES = (
        (TAGGER, 'Tagger'),
        (MANAGER, 'Manager'),
    )
    role = models.PositiveSmallIntegerField(
        choices=ROLE_CHOICES, blank=True, null=True, default=1)
    skills = models.ManyToManyField(Skill, blank=True)

    def __str__(self):
        return str(self.user)
        # return "a"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # logic when a new user is being created
        Profile.objects.create(user=instance)
        pass
    else:
        pass
        # logic when an user is being updated


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


class Campaign(models.Model):
    title = models.CharField(max_length=120, default="", blank=True)
    description = models.TextField(default="", blank=True)
    completed = models.BooleanField(default=False)
    isNllb = models.BooleanField(default=False)
    
    originalLanguage = models.TextField(default="", blank=True)
    targetLanguage = models.TextField(default="", blank=True)
    
    owner = models.ForeignKey(Profile, on_delete=models.CASCADE, null=True)

    requiredSkills = models.ManyToManyField(Skill, blank=True)

    assignedTranslators = models.ManyToManyField(Profile, related_name="campaignTranslators", blank=True)
    assignedTaggers = models.ManyToManyField(Profile, related_name="campaignTaggers", blank=True)

    taggersPerValidation = models.PositiveIntegerField(default=1, blank=True)
    validationThreshold = models.PositiveIntegerField(default=50, blank=True)

    NO_ANSWER = 0
    TRANSLATION = 1
    VALIDATION = 2

    CAMPAIGN_TYPE_CHOICES = (
        (NO_ANSWER, 'N/A'),
        (TRANSLATION, 'Translation'),
        (VALIDATION, 'Validation'),
    )

    campaignType = models.PositiveSmallIntegerField(
        choices=CAMPAIGN_TYPE_CHOICES, blank=True, null=True, default=0)

    def __str__(self):
        return self.title

class CampaignItem(models.Model):
    originalItem = models.TextField(default="")
    translatedItem = models.TextField(default="")
    comments = models.TextField(default="", blank=True)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)

    status = models.TextField(default="translating") # "translating" - "validating" - "completed"



    assignedTagger = models.ManyToManyField(Profile, related_name="itemTaggers", default=None, blank=True)
    assignedTranslator = models.ForeignKey(
        Profile, related_name="itemTranslator", on_delete=models.SET_NULL, null=True, default=None, blank=True)

    def __str__(self):
        return self.originalItem


class CampaignItemAnswer(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, null=True)
    campaignItem = models.ForeignKey(CampaignItem, on_delete=models.CASCADE, null=True)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, null=True)
    type = models.TextField(default="translation", blank=True, null=True) # "translation" - "validation" - "editing"
    cycle = models.PositiveIntegerField(default=0, blank=True, null=True)

    NO_ANSWER = 0
    GOOD_TRANSLATION = 1
    BAD_TRANSLATION = 2

    TRANSLATION_CHOICES = (
        (NO_ANSWER, 'N/A'),
        (GOOD_TRANSLATION, 'Good translation'),
        (BAD_TRANSLATION, 'Bad translation'),
    )
    translationQuality = models.PositiveSmallIntegerField(
        choices=TRANSLATION_CHOICES, blank=True, null=True, default=0)

    comment = models.TextField(blank=True, default='')
    translation = models.TextField(blank=True, default='')
    answerTime = models.PositiveIntegerField(blank=True, null=True, default=0)

    def __str__(self):
        return str(self.campaignItem) + " - " + str(self.profile) + " - " + str(self.cycle) + " - " + self.type
