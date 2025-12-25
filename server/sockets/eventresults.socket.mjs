import EventResultModel from "../models/EventResultModel.mjs";

export default (io, db) => {
  const eventModel = EventResultModel(db);

  const nsp = io.of("/eventresults");

  nsp.on("connection", (socket) => {
    console.log("Client connected to /eventresults");

    let intervalId = null;
    let currentRoom = null;

    /**
     * Join a room based on eventType
     * The room name will be "eventType:{eventType}"
     * After joining, client will receive event results every 2 seconds
     */
    socket.on("join", ({ eventType }) => {
      if (!eventType) {
        return socket.emit("error", { message: "eventType is required" });
      }

      // Leave previous room if exists
      if (currentRoom) {
        socket.leave(currentRoom);
        if (intervalId) clearInterval(intervalId);
      }

      // Create room name
      const roomName = `eventType:${eventType}`;
      currentRoom = roomName;

      // Join the room
      socket.join(roomName);
      console.log(`Client joined room: ${roomName}`);

      // Acknowledge join
      socket.emit("joined", { room: roomName, message: `Successfully joined room: ${roomName}` });

      // Send immediate response
      try {
        const rows = eventModel.getEventResultsByType(eventType);
        nsp.to(roomName).emit("eventresults", { eventType, data: rows });
      } catch (err) {
        console.error(err);
        socket.emit("error", { message: "Failed to fetch event results" });
      }

      // Emit to room every 2 seconds
      intervalId = setInterval(() => {
        try {
          const rows = eventModel.getEventResultsByType(eventType);
          nsp.to(roomName).emit("eventresults", { eventType, data: rows, timestamp: new Date().toISOString() });
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    });

    /**
     * Leave a room
     */
    socket.on("leave", ({ eventType }) => {
      if (!eventType) {
        return socket.emit("error", { message: "eventType is required" });
      }

      const roomName = `eventType:${eventType}`;
      socket.leave(roomName);
      currentRoom = null;

      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      console.log(`Client left room: ${roomName}`);
      socket.emit("left", { room: roomName, message: `Successfully left room: ${roomName}` });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from /eventresults");
      if (intervalId) clearInterval(intervalId);
    });
  });
};
