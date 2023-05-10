from django.contrib import admin
from .models import Skill, CampaignItem, Campaign, Profile, CampaignItemAnswer


class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'get_skills')
    # list_display = ('role', 'get_skills')

    def get_skills(self, obj):
        return "\n".join([skill.title for skill in obj.skills.all()])


class SkillAdmin(admin.ModelAdmin):
    list_display = ('title', 'description')


class CampaignItemAdmin(admin.ModelAdmin):
    list_display = ('originalItem', 'translatedItem', 'status', 'campaign', 'get_assigned_taggers', 'assignedTranslator')
    def get_assigned_taggers(self, obj):
        return "\n".join([tagger.user.username for tagger in obj.assignedTagger.all()])


class CampaignAdmin(admin.ModelAdmin):
    list_display = ('title', 'completed', 'owner', 'isNllb', 'campaignType', 'originalLanguage', 'targetLanguage', 'get_required_skills', 'get_assigned_taggers', 'get_assigned_translators', 'taggersPerValidation', 'validationThreshold',)

    def get_required_skills(self, obj):
        return "\n".join([skill.title for skill in obj.requiredSkills.all()])

    def get_assigned_taggers(self, obj):
        return "\n".join([profile.user.username for profile in obj.assignedTaggers.all()])

    def get_assigned_translators(self, obj):
        return "\n".join([profile.user.username for profile in obj.assignedTranslators.all()])


class CampaignItemAnswerAdmin(admin.ModelAdmin):
    list_display = ('profile', 'campaign', 'campaignItem', 'translation', 'cycle', 'type', 'translationQuality', 'comment', 'answerTime')


# Register your models here.
admin.site.register(Profile, ProfileAdmin)
admin.site.register(Skill, SkillAdmin)
admin.site.register(CampaignItem, CampaignItemAdmin)
admin.site.register(CampaignItemAnswer, CampaignItemAnswerAdmin)
admin.site.register(Campaign, CampaignAdmin)
