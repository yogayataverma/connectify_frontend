import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const SERVER_URL = "http://https://connectify-backend-pq4o.onrender.com:5000";
const socket = io(SERVER_URL);

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [isUsernameSet, setIsUsernameSet] = useState(!!localStorage.getItem("username"));
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (isUsernameSet) {
      socket.emit("registerUser", { username });

      const fetchMessagesAndUsers = async () => {
        try {
          const messagesRes = await axios.get(`${SERVER_URL}/messages`);
          setMessages(messagesRes.data);

          const onlineUsersRes = await axios.get(`${SERVER_URL}/online-users`);
          setOnlineUsers(onlineUsersRes.data);
        } catch (err) {
          console.error(err);
        }
      };

      fetchMessagesAndUsers();
    }

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("userConnected", (users) => {
      setOnlineUsers(users);
    });

    socket.on("userDisconnected", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userConnected");
      socket.off("userDisconnected");
    };
  }, [isUsernameSet]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      content: newMessage,
    };
    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem("username", username);
      setIsUsernameSet(true);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${SERVER_URL}/upload`, formData);
      const { fileUrl, fileType } = res.data;

      const messageData = {
        content: "",
        fileUrl,
        fileType,
      };
      socket.emit("sendMessage", messageData);
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10">
      {!isUsernameSet ? (
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Welcome to ChatApp</h1>
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Join Chat
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg flex flex-col">
          <header className="bg-blue-600 text-white text-center py-4 rounded-t-lg">
            <h1 className="text-2xl font-semibold">Connectify</h1>
          </header>

          <div className="p-4 h-[500px] overflow-y-auto bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`my-3 p-4 rounded-lg shadow-md w-fit max-w-xl ${
                  msg.sender === username
                    ? "bg-blue-100 text-blue-900 self-end ml-auto"
                    : "bg-gray-200 text-gray-900 self-start mr-auto"
                }`}
              >
                {msg.fileUrl ? (
                  <>
                    {msg.fileType.startsWith("video") ? (
                      <video controls className="max-w-full">
                        <source src={`${SERVER_URL}${msg.fileUrl}`} type={msg.fileType} />
                        Your browser does not support the video tag.
                      </video>
                    ) : msg.fileType.startsWith("audio") ? (
                      <audio controls className="max-w-full">
                        <source src={`${SERVER_URL}${msg.fileUrl}`} type={msg.fileType} />
                        Your browser does not support the audio tag.
                      </audio>
                    ) : msg.fileType.startsWith("image") ? (
                      <img
                        src={`${SERVER_URL}${msg.fileUrl}`}
                        alt="Uploaded"
                        className="max-w-full h-auto rounded-lg"
                      />
                    ) : msg.fileType === "application/pdf" ? (
                      <iframe
                        src={`${SERVER_URL}${msg.fileUrl}`}
                        className="w-full h-64"
                        title="PDF Preview"
                      ></iframe>
                    ) : msg.fileType.startsWith("text") ? (
                      <iframe
                        src={`${SERVER_URL}${msg.fileUrl}`}
                        className="w-full h-32 bg-gray-50"
                        title="Text Preview"
                      ></iframe>
                    ) : (
                      <p className="text-gray-500">
                        File cannot be previewed. Click below to download.
                      </p>
                    )}
                    <a
                      href={`${SERVER_URL}${msg.fileUrl}`}
                      download
                      className="block mt-2 text-blue-600 underline"
                    >
                      View/Download File
                    </a>
                  </>
                ) : (
                  <>
                    <strong className="block font-medium">{msg.sender}:</strong>
                    <p>{msg.content}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-100 border-t flex items-center space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-lg cursor-pointer hover:bg-gray-400"
            >
              Upload
            </label>
            <button
              onClick={() => {
                socket.emit("clearChat");
                setMessages([]);
              }}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
            >
              Clear Chat
            </button>
          </div>

          <footer className="py-4 bg-gray-200 text-center text-sm">
            <strong>Online Users:</strong> {onlineUsers.join(", ")}
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
