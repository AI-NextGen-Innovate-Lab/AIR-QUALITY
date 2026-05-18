def calculate_aqi(pm25=None, pm10=None, no2=None, o3=None, so2=None, co=None):
    """
    Calculates AQI based on various pollutants using US EPA standards.
    Returns the maximum AQI value among all pollutants.
    """
    aqis = []

    if pm25 is not None:
        aqis.append(calculate_pm25_aqi(pm25))
    if pm10 is not None:
        aqis.append(calculate_pm10_aqi(pm10))
    if no2 is not None:
        aqis.append(calculate_no2_aqi(no2))
    if o3 is not None:
        aqis.append(calculate_o3_aqi(o3))
    
    if not aqis:
        return 0
    
    return max(aqis)

def linear_interpolate(cp, ih, il, bph, bpl):
    return ((ih - il) / (bph - bpl)) * (cp - bpl) + il

def calculate_pm25_aqi(cp):
    if cp < 0: return 0
    if cp <= 12.0: return round(linear_interpolate(cp, 50, 0, 12.0, 0))
    if cp <= 35.4: return round(linear_interpolate(cp, 100, 51, 35.4, 12.1))
    if cp <= 55.4: return round(linear_interpolate(cp, 150, 101, 55.4, 35.5))
    if cp <= 150.4: return round(linear_interpolate(cp, 200, 151, 150.4, 55.5))
    if cp <= 250.4: return round(linear_interpolate(cp, 300, 201, 250.4, 150.5))
    if cp <= 350.4: return round(linear_interpolate(cp, 400, 301, 350.4, 250.5))
    if cp <= 500.4: return round(linear_interpolate(cp, 500, 401, 500.4, 350.5))
    return 500

def calculate_pm10_aqi(cp):
    if cp < 0: return 0
    if cp <= 54: return round(linear_interpolate(cp, 50, 0, 54, 0))
    if cp <= 154: return round(linear_interpolate(cp, 100, 51, 154, 55))
    if cp <= 254: return round(linear_interpolate(cp, 150, 101, 254, 155))
    if cp <= 354: return round(linear_interpolate(cp, 200, 151, 354, 255))
    if cp <= 424: return round(linear_interpolate(cp, 300, 201, 424, 355))
    if cp <= 504: return round(linear_interpolate(cp, 400, 301, 504, 425))
    if cp <= 604: return round(linear_interpolate(cp, 500, 401, 604, 505))
    return 500

def calculate_no2_aqi(cp):
    # NO2 1-hour ppb
    if cp < 0: return 0
    if cp <= 53: return round(linear_interpolate(cp, 50, 0, 53, 0))
    if cp <= 100: return round(linear_interpolate(cp, 100, 51, 100, 54))
    if cp <= 360: return round(linear_interpolate(cp, 150, 101, 360, 101))
    if cp <= 649: return round(linear_interpolate(cp, 200, 151, 649, 361))
    if cp <= 1249: return round(linear_interpolate(cp, 300, 201, 1249, 650))
    if cp <= 1649: return round(linear_interpolate(cp, 400, 301, 1649, 1250))
    if cp <= 2049: return round(linear_interpolate(cp, 500, 401, 2049, 1650))
    return 500

def calculate_o3_aqi(cp):
    # O3 8-hour ppm
    # Assuming cp is in ppb, convert to ppm
    cp_ppm = cp / 1000.0
    if cp_ppm < 0: return 0
    if cp_ppm <= 0.054: return round(linear_interpolate(cp_ppm, 50, 0, 0.054, 0))
    if cp_ppm <= 0.070: return round(linear_interpolate(cp_ppm, 100, 51, 0.070, 0.055))
    if cp_ppm <= 0.085: return round(linear_interpolate(cp_ppm, 150, 101, 0.085, 0.071))
    if cp_ppm <= 0.105: return round(linear_interpolate(cp_ppm, 200, 151, 0.105, 0.086))
    if cp_ppm <= 0.200: return round(linear_interpolate(cp_ppm, 300, 201, 0.200, 0.106))
    return 300 # EPA doesn't define 8-hr O3 above 0.2 ppm for higher AQIs

def get_aqi_status(aqi):
    if aqi <= 50: return 'Good'
    if aqi <= 100: return 'Moderate'
    if aqi <= 150: return 'Unhealthy for Sensitive Groups'
    if aqi <= 200: return 'Unhealthy'
    if aqi <= 300: return 'Very Unhealthy'
    return 'Hazardous'

def get_recommendation(aqi, sensor_id=""):
    status = get_aqi_status(aqi)
    if status == 'Good':
        return f"Air quality at {sensor_id or 'this location'} is satisfactory. Ideal for outdoor activities."
    if status == 'Moderate':
        return f"Air quality is acceptable. However, sensitive individuals should consider reducing prolonged outdoor exertion at {sensor_id or 'this location'}."
    if status == 'Unhealthy for Sensitive Groups':
        return f"Members of sensitive groups may experience health effects. The general public is less likely to be affected."
    if status == 'Unhealthy':
        return f"Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects."
    if status == 'Very Unhealthy':
        return f"Health alert: everyone may experience more serious health effects."
    return "Health warnings of emergency conditions. The entire population is more likely to be affected."

def get_group_recommendations(aqi):
    """
    Returns specific recommendations for different demographic groups based on AQI.
    """
    if aqi <= 50: # Good
        return {
            'general': ["Enjoy your outdoor activities! This is a great time to be outside."],
            'sensitive': ["Air quality is great. No special precautions needed."],
            'children': ["Perfect weather for outdoor play and physical education."],
            'asthmatic': ["Ideal conditions. Continue with normal activities."]
        }
    elif aqi <= 100: # Moderate
        return {
            'general': ["Air quality is acceptable. Good for most outdoor activities."],
            'sensitive': ["Unusually sensitive individuals should consider reducing prolonged outdoor exertion."],
            'children': ["Outdoor play is fine, but monitor children with respiratory issues."],
            'asthmatic': ["Keep an eye on symptoms; have your inhaler nearby just in case."]
        }
    elif aqi <= 150: # Unhealthy for Sensitive Groups
        return {
            'general': ["The general public is not likely to be affected. Outdoor activities are still fine."],
            'sensitive': ["Reduce prolonged or heavy outdoor exertion. Take more breaks."],
            'children': ["Limit vigorous outdoor activities. Plan for more indoor play."],
            'asthmatic': ["Follow your asthma action plan. Keep quick-relief medicine handy."]
        }
    elif aqi <= 200: # Unhealthy
        return {
            'general': ["Everyone should reduce prolonged or heavy outdoor exertion."],
            'sensitive': ["Avoid prolonged or heavy outdoor exertion. Move activities indoors."],
            'children': ["Children should avoid vigorous outdoor play. Keep them indoors if possible."],
            'asthmatic': ["Strictly avoid outdoor exertion. Stay in a clean-air environment."]
        }
    elif aqi <= 300: # Very Unhealthy
        return {
            'general': ["Avoid all prolonged or heavy outdoor exertion. Stay indoors."],
            'sensitive': ["Stay indoors and keep activity levels low. Use air filtration if available."],
            'children': ["Keep children indoors at all times. Avoid all physical exertion."],
            'asthmatic': ["Health alert: stay indoors in a temperature-controlled environment."]
        }
    else: # Hazardous
        return {
            'general': ["Remain indoors. Avoid all physical activity. Keep windows closed."],
            'sensitive': ["Emergency condition: Stay in a clean-air room. Minimize all activity."],
            'children': ["Strictly keep children indoors. Use high-efficiency air filters."],
            'asthmatic': ["Extreme danger: Do not leave indoor areas. Use medical-grade filtration."]
        }
