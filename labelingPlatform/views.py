from rest_framework import viewsets
from .serializers import CampaignSerializer, ProfileSerializer, SkillSerializer, CampaignItemSerializer, CampaignItemAnswerSerializer
from .models import Campaign, Profile, Skill, CampaignItem, CampaignItemAnswer
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.utils.decorators import method_decorator

from django.core.files.storage import FileSystemStorage

from django.db.models import Max
from django.db.models import Count

import json
import pandas as pd
from io import StringIO

# Auth imports
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny, IsAuthenticated

# React imports
from django.conf import settings

# Create your views here.


fs = FileSystemStorage(location='tmp/')


@method_decorator(csrf_exempt, name='dispatch')
class ProfileView(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()

    '''
    This function receive a body with the following key/values:
    username: string
    role: number
    skills: [number]

    then update the profile's role and skills with the matching username
    '''
    @action(detail=False, methods=['PUT'])
    def update_profile(self, request):
        user = User.objects.filter(username=request.data['username'])[:1]
        if user.count() > 0:
            profile = Profile.objects.get(user=user)

            profile.role = request.data['role']
            profile.skills.set(request.data['skills'])

            profile.save()

            return Response({'status': 'Done'})
        return Response({'status': 'User not found'})

@method_decorator(csrf_exempt, name='dispatch')
class CampaignItemAnswerView(viewsets.ModelViewSet):
    serializer_class = CampaignItemAnswerSerializer
    queryset = CampaignItemAnswer.objects.all()


    '''
    This function receive a body with the following key/values:
    campaign: Campaign

    then return a list with every CampaignItemAnswer contained by the campaign in the body
    '''
    @action(detail=False, methods=['POST'])
    def get_campaign_item_answers(self, request):
        campaign_id = request.data['campaign']['id']
        campaign_answers = CampaignItemAnswer.objects.filter(campaign=campaign_id)

        ser = CampaignItemAnswerSerializer(campaign_answers, many=True)
        return Response(ser.data)


    '''
    This function receive a body with the following key/values:
    profile: number,
    campaign: Campaign,
    campaignItem: CampaignItem,
    translationQuality: number,
    type: string,
    comment: string,
    translation: string,
    answerTime: number,
    
    then it uses those values to make a new object of type CampaignItemAnswer 
    updating the cycle value accordingly con the amount of iterations 
    of the CampaignItem in the NLLB flow
    '''
    @action(detail=False, methods=['PUT'])
    def new_answer(self, request):
        newAnswer = CampaignItemAnswer.objects.create()
        answers = CampaignItemAnswer.objects.filter(campaignItem=request.data['campaignItem'])

        cycle = 0
        if (answers.count() != 0):
            cycle = answers.aggregate(Max('cycle'))['cycle__max']

        if request.data['type'] == 'translation' or cycle == 0:
            cycle = cycle + 1

        profile = Profile.objects.get(pk=request.data['profile'])
        campaignItem = CampaignItem.objects.get(pk=request.data['campaignItem'])
        campaign = Campaign.objects.get(pk=request.data['campaign'])
        
        newAnswer.profile = profile
        newAnswer.campaignItem = campaignItem
        newAnswer.translation = request.data['translation']
        newAnswer.campaign = campaign
        newAnswer.type = request.data['type']
        newAnswer.cycle = cycle
        newAnswer.translationQuality = request.data['translationQuality']
        newAnswer.comment = request.data['comment']
        newAnswer.answerTime = request.data['answerTime']
        newAnswer.save()

        return Response({'status': 'Done'})

    '''
    This function receive a body with the following key/values:
    campaignItem: CampaignItem,
    type: string

    type can be "translate" or "validate"

    if type == "translate" then returns a string with the latest comments in the answers of the campaignItem 
    if type == "validate" then returns a string with the latest translation in the answers of the campaignItem 
    '''
    @action(detail=False, methods=['PUT'])
    def get_latest_answer(self, request):
        answers = CampaignItemAnswer.objects.filter(campaignItem=request.data['campaignItem']['id'])#.exclude(campaignItem__status="editing")
        campaignItem = CampaignItem.objects.get(pk=request.data['campaignItem']['id'])
        
        cycle = 0
        if (answers.count() != 0):
            maxCycle = answers.aggregate(Max('cycle'))
            cycle = maxCycle['cycle__max']

        if request.data['type'] == 'translate':
            answers = CampaignItemAnswer.objects.filter(cycle=cycle, type="validation")
            comments = ""
            for answer in answers:
                comments = comments + answer.comment + "\n"

            return Response({"status": "done", "comments": comments})
        elif request.data['type'] == 'validate': 
            answer = answers.order_by('-cycle')
            if cycle == 0 or answer.count() == 0:
                return Response({"status": "default", "translation": campaignItem.translatedItem})

            for a in answer:
                if a.campaignItem.status != "editing" or a.type != "translation":
                    return Response({"status": "latest", "translation": a.translation})
            
            return Response({"status": "default", "translation": campaignItem.translatedItem})


            # return Response({"status": "latest", "translation": answer[0].translation})

        else:
            return Response({"status": "not implemented", "translation": ""})

    '''
    This function receive a body with the following key/values:
    userTest: *User,
    campaign: Campaign | string,

    then return an array with all the CampaignItemAnswer answered by the user. 
    Those can also be filtered by Campaign if campaign is an object and not an empty string. 
    '''
    @action(detail=False, methods=['PUT'])
    def get_user_answers(self, request):
        user_id = request.data['userTest']['user_id']
        profile = Profile.objects.get(user=user_id)
        campaign = request.data['campaign']

        if campaign != "":
            answers = CampaignItemAnswer.objects.filter(profile=profile, campaign=campaign['id'])
        else:
            answers = CampaignItemAnswer.objects.filter(profile=profile)

        if answers != None and len(answers) > 0:
            ser = CampaignItemAnswerSerializer(answers, many=True)
            return Response(ser.data)

        return Response({'status': 'Error'})

    '''
    This function receive a body with the following key/values:
    answer: CampaignItemAnswer
    
    then check if the answer has already been assigned to a validator
    if it was assigned, return status error
    if it was not, change the answer status to "editing" and return status done
    '''
    @action(detail=False, methods=['PUT'])
    def edit_answer(self, request):
        answer = CampaignItemAnswer.objects.get(pk = request.data['answer']['id'])

        item = CampaignItem.objects.get(pk = answer.campaignItem.id)

        oldStatus = item.status

        # temporal item lock
        item.status = "editing"
        item.save()

        itemValidatorsAmount = item.assignedTagger.all().count()

        if itemValidatorsAmount == 0:
            return Response({"status": "done"})
        else: 
            item.status = oldStatus
            item.save()
        return Response({"status": "Error"})
    
    '''
    This function receive a body with the following key/values:
    user: number (id)
    campaignItem: number (id)

    then return the latest answer for that user and campaignItem
    '''
    @action(detail=False, methods=['PUT'])
    def get_answer(self, request):
        answer = CampaignItemAnswer.objects.all()
        answer = answer.filter(profile=request.data['user'], campaignItem=request.data['campaignItem'])
        cycle = answer.aggregate(Max('cycle'))['cycle__max']
        answer = answer.filter(cycle=cycle)
        ser = CampaignItemAnswerSerializer(answer, many=True)
        return Response(ser.data)

@method_decorator(csrf_exempt, name='dispatch')
class CampaignView(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    queryset = Campaign.objects.all()

    '''
    This function receive a body with the following key/values:
    campaign: Campaign

    then creates an entry in te Campaign table with the new campaign
    '''
    # Maybe this can be replaced with the default POST of CampaignView
    @action(detail=False, methods=['PUT'])
    def new_campaign(self, request):
        newCampaign = Campaign.objects.create()
        user_id = request.data['owner']
        owner = Profile.objects.get(user=user_id)
        newCampaign.title = request.data['title']
        newCampaign.owner = owner
        newCampaign.description = request.data['description']
        newCampaign.isNllb = request.data['isNllb']
        newCampaign.campaignType = request.data['campaignType']
        newCampaign.originalLanguage = request.data['originalLanguage']
        newCampaign.targetLanguage = request.data['targetLanguage']
        newCampaign.taggersPerValidation = request.data['taggersPerValidation']
        newCampaign.validationThreshold = request.data['validationThreshold']


        for skill in request.data['requiredSkills']:
            newCampaign.requiredSkills.add(skill)

        for profile in request.data['assignedTranslators']:
            newCampaign.assignedTranslators.add(profile)

        for profile in request.data['assignedTaggers']:
            newCampaign.assignedTaggers.add(profile)

        newCampaign.save()
        return Response({'status': 'ok', 'newCampaignPK': newCampaign.pk})

    '''
    This function receive a body with the following key/values:
    campaign: Campaign
    
    then creates a bulk of CampaignItem from a dataset and associate them to the Campaign in the body
    '''
    @action(detail=True, methods=['PUT'])
    def upload_dataset(self, request, pk=None):
        # update dataset
        if 'campaignDataset' in request.FILES:
            activeCampaign = Campaign.objects.get(pk=pk)
            CampaignItem.objects.filter(campaign=activeCampaign).delete()

            status = "translating" if activeCampaign.campaignType == 1 else "validating"

            campaign_items_list = []

            file = request.FILES['campaignDataset']
            content = file.read().decode("utf-8")

            if file.name.endswith('.json'):
                json_file = json.loads(content) # dicts are ordered since python 3.7

                for ob in json_file:
                    items = []
                    originalItem = ""
                    translatedItem = ""
                    comments = ""

                    for key in ob.keys():
                        if key != 'url' and key != 'comments':
                            items.append(ob[key])
                        elif key == 'comments':
                            comments = ob[key]

                    originalItem = items[0]
                    if len(items) > 1 and (activeCampaign.isNllb == True or activeCampaign.campaignType == 2):
                        translatedItem = items[1]
                    
                    campaign_items_list.append(CampaignItem(
                        originalItem=originalItem, translatedItem=translatedItem, status=status, campaign=activeCampaign, comments=comments))


            if file.name.endswith('.csv'):
                csvStringIO = StringIO(content)
                df = pd.read_csv(csvStringIO, sep=",", encoding="utf-8")

                filtered_cols = []
                items = []

                cols = [col for col in df.columns if col != 'url' and col != 'comments']

                filtered_cols.append(cols[0])
                items.append("originalItem")

                if len(cols) > 1 and (activeCampaign.isNllb == True or activeCampaign.campaignType == 2):
                    filtered_cols.append(cols[1])
                    items.append("translatedItem")

                if "comments" in df.columns:
                    filtered_cols.append("comments")
                    items.append("comments")

                campaign_item_list = []
                for v in df[filtered_cols].values:
                    originalItem = ''
                    translatedItem = ''
                    comments = '' 
                    for item, value in list(zip(items, v)):
                        originalItem = value if item == 'originalItem' else originalItem
                        translatedItem = value if item == 'translatedItem' else translatedItem
                        comments = value if item == 'comments' else comments

                    campaign_items_list.append(CampaignItem(
                        originalItem=originalItem, translatedItem=translatedItem, status=status, campaign=activeCampaign, comments=comments))

            if len(campaign_items_list) > 0:
                CampaignItem.objects.bulk_create(campaign_items_list)

        return Response({'status': 'Campaign updated'})


@method_decorator(csrf_exempt, name='dispatch')
class SkillView(viewsets.ModelViewSet):
    serializer_class = SkillSerializer
    queryset = Skill.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class CampaignItemView(viewsets.ModelViewSet):
    serializer_class = CampaignItemSerializer
    queryset = CampaignItem.objects.all()

    '''
    This function receive a body with the following key/values:
    campaign: Campaign

    then return a list with every CampaignItem associated with the Campaign in the body
    '''
    @action(detail=False, methods=['POST'])
    def get_campaign_items(self, request):
        campaign_id = request.data['campaign']['id']
        campaign_items = CampaignItem.objects.filter(campaign=campaign_id)

        ser = CampaignItemSerializer(campaign_items, many=True)
        return Response(ser.data)

    '''
    This function receive a body with the following key/values:
    userTest: *User,
    campaignId: number,
    type: string,
    
    if type == "translate" then it tries to return a CampaignItem in the translation phase
    if type == "validate" then it tries to return a CampaignItem in the validation phase

    if there is no available CampaignItem, it returns an Error message
    '''
    @action(detail=False, methods=['POST', 'GET'])
    def get_item(self, request):
        user_id = request.data['userTest']['user_id']
        profile = Profile.objects.get(user=user_id)
        campaign = Campaign.objects.get(pk=request.data['campaignId'])

        answers = CampaignItemAnswer.objects.all()
    
        if (request.data['type'] == 'translate'):
            # check if the user is currently editing an item
            # in which case the editing item is prioritized and returned
            editingItem = CampaignItem.objects.filter(
                assignedTranslator=profile, status="editing", campaign=campaign)[:1]
            
            if editingItem.count() != 0:
                ser = CampaignItemSerializer(editingItem, many=True)
                return Response(ser.data)

            # Check if the user is already translating an item
            # in which case the translating item is prioritized and returned
            item = CampaignItem.objects.filter(
                assignedTranslator=profile, status="translating", campaign=campaign)[:1]

            if item == None or item.count() == 0:
                # Get translating campaign items without assigned translator
                items = CampaignItem.objects.filter(assignedTranslator=None, status="translating", campaign=campaign)
                item = []

                for i in items:
                    # A user can't translate the same item more than once
                    # since if the same item needs a retranslation
                    # means that the previous translation was rejected
                    old = CampaignItemAnswer.objects.filter(campaignItem=i, profile=profile, type="translation")
                    if old.count() == 0:
                        item.append(i)

            if item != None and len(item) > 0:
                biggest_cycle = 0
                priority_item = item[0]

                # Here I tried to set a higher priority to items that were rejected 
                # (biggest cycle or amount of iterations in the nllb)
                # the cycle goes up by 1 every time the answer changes from validating to translating
                # that is why I'm looking for the highest cycle validation
                for i in item:
                    answers = CampaignItemAnswer.objects.filter(campaignItem=i, profile=profile, type="validation")
                    cycle = answers.aggregate(Max('cycle'))['cycle__max']
                    answers = answers.filter(cycle=cycle)

                    if answers.count() > 0:
                        if cycle > biggest_cycle:
                            biggest_cycle = cycle
                            priority_item = i

                priority_item.assignedTranslator = profile
                priority_item.save(update_fields=["assignedTranslator"])
                ser = CampaignItemSerializer([priority_item], many=True)

                return Response(ser.data)

        elif (request.data['type'] == 'validate'):
            # check every campaign item in which the user is assigned as a tagger
            items = CampaignItem.objects.filter(
                assignedTagger__in=[profile], status="validating", campaign=campaign)
            item = []

            for i in items:
                # check if the user already validated in the current validation cycle for this campaign item
                a = answers.filter(campaignItem=i)
                cycle = a.aggregate(Max('cycle'))['cycle__max']
                a = a.filter(cycle=cycle, profile=profile, type='validation')

                # only save the campaign item if the user had not validated the same item on the current cycle
                if a.count() == 0:
                    item.append(i)

            if len(item) == 0:
                # check for (validating) items with less than count(assignedTagger) taggers in which the user is not assigned as tagger
                items = CampaignItem.objects.annotate(c=Count('assignedTagger')).filter(c__lt=campaign.taggersPerValidation, status="validating", campaign=campaign).exclude(assignedTagger__in=[profile])

                item = []

                # Si un usuario tradujo el item en algun momento de su vida
                # entonces no puede etiquetarlo, jamas, ever (?)
                # o al menos eso hace este for (quitar el if para anular)
                for i in items:
                    old = CampaignItemAnswer.objects.filter(campaignItem=i, profile=profile, type="translation")
                    # if old.count() == 0:
                    item.append(i)

            if len(item) > 0:
                for i in item:
                    a = answers.filter(campaignItem=i)
                    cycle = a.aggregate(Max('cycle'))['cycle__max']
                    a = a.filter(cycle=cycle, profile=profile)
                    if a.count() == 0:
                        i.assignedTagger.add(profile)
                        i.save()
                        ser = CampaignItemSerializer([i], many=True)
                        return Response(ser.data)

        return Response([{'status': 'Error'}])

    '''
    This function receive a body with the following key/values:
    status: string
    
    then updates the status of the CampaignItem (passed as a pk in the url)
    the update is made considering a NLLB-flow and a normal translation-validation Campaign.
    '''
    @action(detail=True, methods=['PUT'])
    def update_item(self, request, pk):
        item = CampaignItem.objects.filter(pk=pk)[:1]
        status = request.data['status']

        if item != None and len(item) > 0:
            item = item[0]
            campaign = item.campaign
            if status == "translating" or status =="editing":
                item.status = "completed"
                if campaign.isNllb == True:
                    item.status = "validating"

            elif status == "validating":

                item.status = "validating"

                taggersPerValidation = campaign.taggersPerValidation
                validationThreshold = campaign.validationThreshold / 100

                answers = CampaignItemAnswer.objects.filter(campaignItem=item, type="validation")
                cycle = answers.aggregate(Max('cycle'))['cycle__max']
                answers = answers.filter(cycle=cycle)
                positiveAnswersRatio = round(answers.filter(translationQuality=1).count() / taggersPerValidation, 4)
                negativeAnswersRatio = round(answers.filter(translationQuality=2).count() / taggersPerValidation, 4)

                if positiveAnswersRatio >= validationThreshold or negativeAnswersRatio >= validationThreshold:
                    item.status = "completed"
                
                if negativeAnswersRatio >= validationThreshold and campaign.isNllb == True:
                    answers = answers.filter(translationQuality=2)
                    comments = ""
                    for answer in answers:
                        if answer.comment != "":
                            if comments == "":
                                comments = answer.comment
                            else :
                                comments = comments + "||\n||" + answer.comment
                    
                    item.status = "translating"
                    item.assignedTranslator = None
                    item.comments = comments
                    item.assignedTagger.clear()

            item.save()

            ser = CampaignItemSerializer([item], many=True)
            return Response(ser.data)

        return Response({'status': 'Error'})

# Auth views here
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
