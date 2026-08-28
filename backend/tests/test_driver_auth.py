def test_driver_registation(client):
    driver_data={
        "name": "Test Driver",
        "email": "testdriver@example.com",
        "phone": "9876543212",
        "password": "password123",
        "vehicle_number": "TS09AB1234",
        "vehicle_type": "Car"
    }
    response = client.post(
        "/driver/register",
        json=driver_data
    )
    assert response.status_code == 201
def test_driver_login(client):
    driver_data={
        "name": "Login Driver",
        "email": "logindriver@example.com",
        "phone": "9876543213",
        "password": "password123",
        "vehicle_number": "TS09CD5678",
        "vehicle_type": "Car"
    }
    client.post(
        "/driver/register",
        json=driver_data
    )
    response = client.post(
         "/driver/login",
        data={
            "username": "logindriver@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
def test_duplicate_driver_registration(client):
    driver_data = {
        "name": "Duplicate Driver",
        "email": "duplicatedriver@example.com",
        "phone": "9876543214",
        "password": "password123",
        "vehicle_number": "TS09EF9012",
        "vehicle_type": "Car"
    }

    client.post(
        "/driver/register",
        json=driver_data
    )

    response = client.post(
        "/driver/register",
        json=driver_data
    )

    assert response.status_code == 400
def test_driver_login_wrong_password(client):
    driver_data = {
        "name": "Wrong Password Driver",
        "email": "wrongdriver@example.com",
        "phone": "9876543215",
        "password": "correctpassword",
        "vehicle_number": "TS09GH3456",
        "vehicle_type": "Car"
    }

    client.post(
        "/driver/register",
        json=driver_data
    )

    response = client.post(
        "/driver/login",
        data={
            "username": "wrongdriver@example.com",
            "password": "wrongpassword"
        }
    )

    assert response.status_code == 401