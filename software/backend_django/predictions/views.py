from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import random
from datetime import datetime, timedelta
from .influx_client import InfluxClient
from .aqi_calculator import calculate_aqi, get_aqi_status, get_recommendation, get_group_recommendations

class PredictionView(APIView):
    def get(self, request):
        sensor_id = request.query_params.get('sensor_id', 'Main Station')
        days = int(request.query_params.get('days', 30))
        metric = request.query_params.get('metric', 'AQI')
        
        influx = InfluxClient()
        latest_data = influx.get_latest_data(sensor_id)
        
        # Fetch historical data for the last 7 days to calculate a simple trend
        history = influx.get_historical_data(sensor_id, days=7, metric=metric)
        
        # Calculate trend (average change per day)
        trend_factor = 0.1 # default
        if len(history) >= 2:
            first_val = history[0]['value']
            last_val = history[-1]['value']
            trend_factor = (last_val - first_val) / len(history)

        if metric == 'AQI':
            base = calculate_aqi(
                pm25=latest_data.get('PM2.5'),
                pm10=latest_data.get('PM10'),
                no2=latest_data.get('NO2'),
                o3=latest_data.get('O3')
            )
        else:
            base = latest_data.get(metric, 15.0)

        predictions = []
        now = datetime.now()
        
        for i in range(1, days + 1):
            date = now + timedelta(days=i)
            # Add variability and the calculated trend
            variance = random.uniform(-5, 5)
            val = round(max(0, base + (trend_factor * i) + variance), 1)
            
            predictions.append({
                'date': date.strftime('%b %d'),
                'value': val,
                'confidence_upper': round(val + 10 + (i * 0.5), 1), # confidence decreases over time
                'confidence_lower': round(max(0, val - 10 - (i * 0.5)), 1),
            })
            
        influx.close()
        return Response({
            'sensor_id': sensor_id,
            'metric': metric,
            'days': days,
            'predictions': predictions,
            'current_value': base
        })

class SensorSummaryView(APIView):
    """
    Provides a summary of current and predicted air quality for specific sensors using real InfluxDB data.
    """
    def get(self, request):
        influx = InfluxClient()
        
        # Fetch sensors dynamically from InfluxDB
        sensor_ids = influx.get_all_sensors()
        sensors_data = []
        
        for sid in sensor_ids:
            real_data = influx.get_latest_data(sid)
            current_aqi = calculate_aqi(
                pm25=real_data.get('PM2.5'),
                pm10=real_data.get('PM10'),
                no2=real_data.get('NO2'),
                o3=real_data.get('O3')
            )
            
            # Simple trend check
            history = influx.get_historical_data(sid, days=2, metric='AQI')
            trend = 'Stable'
            if len(history) >= 2:
                diff = history[-1]['value'] - history[0]['value']
                if diff > 5: trend = 'Increasing'
                elif diff < -5: trend = 'Decreasing'
            
            sensors_data.append({
                'id': sid,
                'location': sid, # Use sensor ID as location if no mapping exists
                'current_aqi': current_aqi,
                'status': get_aqi_status(current_aqi),
                'trend': trend,
                'prediction_7d': round(current_aqi * (1.1 if trend == 'Increasing' else (0.9 if trend == 'Decreasing' else 1.0))),
                'primary_pollutant': 'PM2.5' if real_data.get('PM2.5', 0) > real_data.get('O3', 0) else 'O3',
                'insights': f"Real-time data shows {get_aqi_status(current_aqi).lower()} air quality at {sid}.",
                'recommendation': get_recommendation(current_aqi, sid)
            })
        
        influx.close()
        return Response({
            'timestamp': datetime.now().isoformat(),
            'sensors': sensors_data
        })

class HealthGuideView(APIView):
    def get(self, request):
        aqi = request.query_params.get('aqi')
        
        # Recommendations mapped to AQI levels for all groups
        group_recs = {
            'general': [],
            'sensitive': [],
            'children': [],
            'asthmatic': []
        }
        
        if aqi is not None:
            try:
                aqi_val = int(float(aqi))
                group_recs = get_group_recommendations(aqi_val)
            except ValueError:
                pass
        
        data = {
            'groups': [
                {
                    'id': 'general',
                    'label': 'General Public',
                    'recommendations': group_recs.get('general', [
                        "Ideal for all outdoor activities when AQI is below 50.",
                        "Consider reducing prolonged outdoor exertion if AQI exceeds 100.",
                        "Keep windows closed during peak morning traffic hours.",
                        "Maintain indoor air quality with plants or air purifiers."
                    ])
                },
                {
                    'id': 'sensitive',
                    'label': 'Sensitive Groups',
                    'recommendations': group_recs.get('sensitive', [
                        "Limit outdoor activities when AQI is above 50.",
                        "Avoid areas with high traffic density and visible haze.",
                        "Keep medication (e.g., inhalers) readily available.",
                        "Use N95 masks if outdoor exposure is unavoidable during high pollution."
                    ])
                },
                {
                    'id': 'children',
                    'label': 'Children & Seniors',
                    'recommendations': group_recs.get('children', [
                        "Children should avoid vigorous outdoor play during peak heat/pollution.",
                        "Ensure elderly family members stay hydrated and in cool environments.",
                        "Monitor for symptoms like coughing or unusual fatigue.",
                        "Optimize school/home ventilation during early morning hours."
                    ])
                },
                {
                    'id': 'asthmatic',
                    'label': 'Respiratory Issues',
                    'recommendations': group_recs.get('asthmatic', [
                        "Strictly avoid outdoor exercise on high pollution days.",
                        "Keep a log of symptoms in relation to local AQI levels.",
                        "Consult physician before any planned intense outdoor activity.",
                        "Consider using a HEPA filter in bedrooms for better sleep quality."
                    ])
                }
            ],
            'aqi_scale': [
                {'range': '0 - 50', 'status': 'Good', 'color': 'green', 'description': 'Air quality is satisfactory. No health risk.'},
                {'range': '51 - 100', 'status': 'Moderate', 'color': 'yellow', 'description': 'Air quality is acceptable. Sensitive people should reduce exertion.'},
                {'range': '101 - 150', 'status': 'Unhealthy (SG)', 'color': 'orange', 'description': 'Sensitive groups may experience health effects. Public less likely.'},
                {'range': '151 - 200', 'status': 'Unhealthy', 'color': 'red', 'description': 'Everyone may begin to experience health effects. High risk for sensitive groups.'},
                {'range': '201 - 300', 'status': 'Very Unhealthy', 'color': 'purple', 'description': 'Health alert: everyone may experience more serious health effects.'},
                {'range': '301+', 'status': 'Hazardous', 'color': 'maroon', 'description': 'Health warning of emergency conditions. The entire population is likely to be affected.'},
            ]
        }
        return Response(data)
