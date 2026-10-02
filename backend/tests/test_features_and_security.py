import pytest

def test_student_and_driver_registration_with_phone_strings(client):
    # Test phone with +91 and spaces
    student_res = client.post("/auth/register", json={
        "name": "Intl Student",
        "email": "intl_student@example.com",
        "phone": "+91 9123456780",
        "password": "password123"
    })
    assert student_res.status_code == 201
    assert student_res.json()["email"] == "intl_student@example.com"

    # Test duplicate phone on student registration
    dup_student_res = client.post("/auth/register", json={
        "name": "Dup Student",
        "email": "dup_student@example.com",
        "phone": "+91 9123456780",
        "password": "password123"
    })
    assert dup_student_res.status_code == 400
    assert "already registered" in dup_student_res.json()["detail"].lower()

    # Test driver registration with string phone
    driver_res = client.post("/driver/register", json={
        "name": "Intl Driver",
        "email": "intl_driver@example.com",
        "phone": "+91 9123456781",
        "password": "password123",
        "vehicle_number": "TS09AA9999",
        "vehicle_type": "Car"
    })
    assert driver_res.status_code == 201

    # Test duplicate phone on driver registration
    dup_driver_res = client.post("/driver/register", json={
        "name": "Dup Driver",
        "email": "dup_driver@example.com",
        "phone": "+91 9123456781",
        "password": "password123",
        "vehicle_number": "TS09AA8888",
        "vehicle_type": "Car"
    })
    assert dup_driver_res.status_code == 400
    assert "already registered" in dup_driver_res.json()["detail"].lower()


def test_full_ride_lifecycle_otp_chat_rating(client):
    # 1. Register student & driver
    client.post("/auth/register", json={
        "name": "Lifecycle Student",
        "email": "lifecycle_stu@example.com",
        "phone": "9000000001",
        "password": "pass"
    })
    s_login = client.post("/auth/login", data={"username": "lifecycle_stu@example.com", "password": "pass"})
    s_token = s_login.json()["access_token"]
    s_headers = {"Authorization": f"Bearer {s_token}"}

    client.post("/driver/register", json={
        "name": "Lifecycle Driver",
        "email": "lifecycle_drv@example.com",
        "phone": "9000000002",
        "password": "pass",
        "vehicle_number": "TS09EV1111",
        "vehicle_type": "Electric Shuttle"
    })
    d_login = client.post("/driver/login", data={"username": "lifecycle_drv@example.com", "password": "pass"})
    d_token = d_login.json()["access_token"]
    d_headers = {"Authorization": f"Bearer {d_token}"}

    # Driver goes online
    avail_res = client.put("/driver/availability", json={"is_available": True}, headers=d_headers)
    assert avail_res.status_code == 200

    # 2. Student books ride
    book_res = client.post("/rides/", json={
        "pickup_loc": "Hostel 1",
        "drop_loc": "Library",
        "pickup_lat": 17.5440,
        "pickup_lng": 78.5745,
        "drop_lat": 17.5470,
        "drop_lng": 78.5730
    }, headers=s_headers)
    assert book_res.status_code == 201
    ride_id = book_res.json()["ride_id"]

    # 3. Check /rides/current for student
    curr_res = client.get("/rides/current", headers=s_headers)
    assert curr_res.status_code == 200
    assert curr_res.json()["ride"]["id"] == ride_id

    # 4. Driver accepts ride
    accept_res = client.put(f"/driver/rides/{ride_id}/accept", headers=d_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # 5. Check OTP generated on student side
    curr_res2 = client.get("/rides/current", headers=s_headers)
    assert curr_res2.status_code == 200
    otp = curr_res2.json()["ride"]["otp"]
    assert otp is not None
    assert len(otp) == 4

    # 6. In-ride chat message exchange
    chat_post = client.post(f"/rides/{ride_id}/messages", json={
        "message": "I am waiting at the main porch",
        "sender_role": "student",
        "sender_name": "Lifecycle Student"
    }, headers=s_headers)
    assert chat_post.status_code == 200

    chat_get = client.get(f"/rides/{ride_id}/messages", headers=s_headers)
    assert chat_get.status_code == 200
    assert len(chat_get.json()) >= 1
    assert chat_get.json()[0]["message"] == "I am waiting at the main porch"

    # 7. Driver starts trip with OTP
    start_res = client.put(f"/driver/rides/{ride_id}/start", json={"otp": otp}, headers=d_headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "STARTED"

    # 8. Driver completes trip
    comp_res = client.put(f"/driver/rides/{ride_id}/complete", headers=d_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"

    # 9. Student rates driver
    rate_res = client.post(f"/rides/{ride_id}/rate", json={
        "rating": 5,
        "comment": "Smooth ride and very polite!"
    }, headers=s_headers)
    assert rate_res.status_code == 200
    assert rate_res.json()["rating"] == 5

    # 10. Student tries to rate again -> duplicate error 400
    dup_rate = client.post(f"/rides/{ride_id}/rate", json={
        "rating": 4,
        "comment": "Second attempt"
    }, headers=s_headers)
    assert dup_rate.status_code == 400


def test_help_bot_queries(client):
    res1 = client.post("/help/chat", json={"question": "how to book a ride?", "role": "student"})
    assert res1.status_code == 200
    assert "Pickup and Drop" in res1.json()["answer"]

    res2 = client.post("/help/chat", json={"question": "what is the emergency number?", "role": "student"})
    assert res2.status_code == 200
    assert "9876543210" in res2.json()["answer"]
