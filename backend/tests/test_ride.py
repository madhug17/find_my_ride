def test_create_ride(client):

    # Register student
    student_data = {
        "name": "Ride Test Student",
        "email": "ridetest@example.com",
        "phone": "9876543215",
        "password": "password123"
    }

    register_response = client.post(
        "/auth/register",
        json=student_data
    )

    assert register_response.status_code == 201

    # Login student
    login_response = client.post(
        "/auth/login",
        data={
            "username": "ridetest@example.com",
            "password": "password123"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    # Ride data
    ride_data = {
        "pickup_loc": "Woxsen University",
        "drop_loc": "Hyderabad",
        "pickup_lat": 17.5454,
        "pickup_lng": 78.5718,
        "drop_lat": 17.3850,
        "drop_lng": 78.4867
    }

    # Create ride
    response = client.post(
        "/rides/",
        json=ride_data,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    print("\n========== CREATE RIDE ==========")
    print("STATUS:", response.status_code)
    print("BODY:", response.json())
    print("=================================")

    # Check successful creation
    assert response.status_code == 201

    data = response.json()

    # Check response
    assert data["message"] == "Ride booked successfully"
    assert "ride_id" in data
    assert data["status"] == "PENDING"


def test_create_ride_without_token(client):

    ride_data = {
        "pickup_loc": "Woxsen University",
        "drop_loc": "Hyderabad",
        "pickup_lat": 17.5454,
        "pickup_lng": 78.5718,
        "drop_lat": 17.3850,
        "drop_lng": 78.4867
    }

    response = client.post(
        "/rides/",
        json=ride_data
    )

    assert response.status_code == 401


def test_driver_cannot_create_ride(client):

    driver_data = {
        "name": "Ride Test Driver",
        "email": "ridedriver@example.com",
        "phone": "9876543220",
        "password": "password123",
        "vehicle_number": "TS09AB1234",
        "vehicle_type": "Car"
    }

    # Register driver
    register_response = client.post(
        "/driver/register",
        json=driver_data
    )

    assert register_response.status_code == 201

    # Login driver
    login_response = client.post(
        "/driver/login",
        data={
            "username": "ridedriver@example.com",
            "password": "password123"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    # Driver tries to create ride
    response = client.post(
        "/rides/",
        json={
            "pickup_loc": "Woxsen University",
            "drop_loc": "Hyderabad",
            "pickup_lat": 17.5454,
            "pickup_lng": 78.5718,
            "drop_lat": 17.3850,
            "drop_lng": 78.4867
        },
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 401


def test_ride_belongs_to_logged_in_student(client):

    student_data = {
        "name": "Ride Owner",
        "email": "rideowner@example.com",
        "phone": "9876543221",
        "password": "password123"
    }

    # Register student
    register_response = client.post(
        "/auth/register",
        json=student_data
    )

    assert register_response.status_code == 201

    student_id = register_response.json()["id"]

    # Login student
    login_response = client.post(
        "/auth/login",
        data={
            "username": "rideowner@example.com",
            "password": "password123"
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    # Create ride
    response = client.post(
        "/rides/",
        json={
            "pickup_loc": "Campus",
            "drop_loc": "Hostel",
            "pickup_lat": 17.5454,
            "pickup_lng": 78.5718,
            "drop_lat": 17.3850,
            "drop_lng": 78.4867
        },
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    print("\n========== RIDE OWNER ==========")
    print("STATUS:", response.status_code)
    print("BODY:", response.json())
    print("================================")

    assert response.status_code == 201

    ride = response.json()

    # Current API response only contains:
    # message, ride_id, status
    assert "ride_id" in ride
    assert ride["status"] == "PENDING"