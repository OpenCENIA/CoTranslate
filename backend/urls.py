"""backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from labelingPlatform import views

from django.views.generic import TemplateView


router = routers.DefaultRouter()

# register new urls
router.register(r'campaigns', views.CampaignView, 'campaign')

router.register(r'profiles', views.ProfileView, 'profile')

router.register(r'campaign_items', views.CampaignItemView, 'campaign_item')
router.register(r'campaign_items_answer',
                views.CampaignItemAnswerView, 'campaign_item_answer')

router.register(r'skills', views.SkillView, 'skill')

urlpatterns = [
    path('admin/', admin.site.urls),

    # add urls to urlpatterns
    path('api/', include(router.urls)),
    path('user/', include("labelingPlatform.urls")),

    # redirect to react/frontend static files
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),

] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
