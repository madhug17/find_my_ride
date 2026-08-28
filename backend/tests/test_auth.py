def test_student_registration(client):
    student_data={
        "name": "Test Student",
        "email": "teststudent@example.com",
        "phone": "9999999999",
        "password": "testpassword123"
    }
    response = client.post(
        "/auth/student/register",
        json=student_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == student_data["email"]
    assert data["name"] == student_data["name"]
def test_student_login(client):
    student_data = {
        "name": "Login Student",
        "email": "loginstudent@example.com",
        "phone": "8888888888",
        "password": "testpassword123"
    }
    register_response = client.post(
        "/auth/student/register",
        json=student_data
    )
    assert register_response.status_code == 200

    login_data = {
        "username": student_data["email"],
        "password": student_data["password"]
    }

    response = client.post(
        "/auth/student/login",
        data=login_data
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"