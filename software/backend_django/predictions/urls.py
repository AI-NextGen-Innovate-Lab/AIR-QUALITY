from django.urls import path
from .views import PredictionView, HealthGuideView, SensorSummaryView

urlpatterns = [
    path('predict/', PredictionView.as_view(), name='predict'),
    path('health-guide/', HealthGuideView.as_view(), name='health-guide'),
    path('sensor-summary/', SensorSummaryView.as_view(), name='sensor-summary'),
]
