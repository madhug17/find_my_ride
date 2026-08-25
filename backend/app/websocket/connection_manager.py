from fastapi import WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections={}
    async def connect(
            self,ride_id:int,websocket:WebSocket
    ):
        await websocket.accept()
        if ride_id not in self.active_connections:
            self.active_connections[ride_id]=[]
        self.active_connections[ride_id].append(websocket)
    def disconnect(
            self,ride_id:int,websocket:WebSocket
    ):
        if ride_id in self.active_connections:
            if websocket in self.active_connections[ride_id]:
                self.active_connections[ride_id].remove(websocket)
            if not self.active_connections[ride_id]:
                del self.active_connections[ride_id]
    async def broadcast(
            self,ride_id:int,message:dict
    ):
        if ride_id not in self.active_connections:
            return
        for websocket in self.active_connections[ride_id]:
            await websocket.send_json(message)
    async def send_location(
            self,
            ride_id:int,
            latitude:float,
            longitude:float
    ):
        message ={
            "type": "driver_location",
            "ride_id": ride_id,
            "latitude": latitude,
            "longitude": longitude
        }
        await self.broadcast(
            ride_id,
            message
        )
    async def send_status(
            self,ride_id:int,status:str
    ):
        message={
            "type": "ride_status",
            "ride_id": ride_id,
            "status": status
        }
        await self.broadcast(
            ride_id,message
        )
manager=ConnectionManager()