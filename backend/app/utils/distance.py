import math 
def calculate_distance(
        lat1:float,
        lon1:float,
        lat2:float,
        lon2:float
):
    R = 6371
    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    diff_lat = lat2-lat1
    diff_lon = lon2-lon1
    a = (
        math.sin(diff_lat/2)**2+
        math.cos(lat1)*math.cos(lat2)*math.sin(diff_lon /2)**2
    )
    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )
    distance = R *c
    return distance
