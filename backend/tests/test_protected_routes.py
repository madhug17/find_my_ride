def test_student_me_with_valid(client):
    student_data = {
        "name": "Protected Student",
        "email": "protectedstudent@example.com",
        "phone": "9876543220",
        "password": "password123"
    }
    client.post(
        "/auth/register",
        json=student_data
    )
    login_response = client.post(
        "/auth/login",
        data={
            "username": student_data["email"],
            "password": student_data["password"]
        }
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    assert response.status_code==200
    data = response.json()
    assert data["email"] == student_data["email"]
    assert data["name"] == student_data["name"]
def test_student_me_without_token(client):
    response = client.get(
        "/auth/me"
    )
    assert response.status_code == 401

def test_driver_me_with_valid_token(client):
    driver_data = {
        "name": "Protected Driver",
        "email": "protecteddriver@example.com",
        "phone": "9876543221",
        "password": "password123",
        "vehicle_number": "TS09GH1234",
        "vehicle_type": "Car"
    }


    client.post(
        "/driver/register",
        json=driver_data
    )

    login_response = client.post(
        "/driver/login",
        data={
            "username": driver_data["email"],
            "password": driver_data["password"]
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    response = client.get(
        "/driver/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == driver_data["email"]
    assert data["name"] == driver_data["name"]

def test_driver_me_without_token(client):

    response = client.get("/driver/me")

    assert response.status_code == 401

def test_student_cannot_access_driver_route(client):
    student_data = {
        "name": "Student Role Test",
        "email": "studentrole@example.com",
        "phone": "9876543222",
        "password": "password123"
    }

    client.post(
        "/auth/register",
        json=student_data
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": student_data["email"],
            "password": student_data["password"]
        }
    )
    token = login_response.json()["access_token"]
    response = client.get(
        "/driver/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    assert response.status_code == 401
def test_driver_cannot_access_student_route(client):
    driver_data = {
        "name": "Driver Role Test",
        "email": "driverrole@example.com",
        "phone": "9876543223",
        "password": "password123",
        "vehicle_number": "TS09IJ5678",
        "vehicle_type": "Car"
    }

    client.post(
        "/driver/register",
        json=driver_data
    )
    login_response = client.post(
        "/driver/login",
        data={
            "username": driver_data["email"],
            "password": driver_data["password"]
        }
    )
    token = login_response.json()["access_token"]
    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    assert response.status_code == 401