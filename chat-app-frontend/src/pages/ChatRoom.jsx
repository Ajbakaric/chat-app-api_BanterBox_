import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { createConsumer } from '@rails/actioncable';

const consumer = createConsumer('ws://localhost:3000/cable');

const ChatRoom = ({ user }) => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const messagesEndRef = useRef();

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/v1/chat_rooms/${id}/messages`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error(err));

    const subscription = consumer.subscriptions.create(
      { channel: 'ChatRoomChannel', chat_room_id: id },
      {
        received: (message) => {
          setMessages((prevMessages) => [...prevMessages, message]);
        },
      }
    );

    return () => subscription.unsubscribe();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const formData = new FormData();
    formData.append('message[content]', content);
    if (image) formData.append('message[image]', image);

    axios
      .post(`http://localhost:3000/api/v1/chat_rooms/${id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then(() => {
        setContent('');
        setImage(null);
      })
      .catch((err) => console.error(err));
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditingContent(msg.content);
  };

  const handleEdit = (messageId) => {
    axios
      .patch(
        `http://localhost:3000/api/v1/chat_rooms/${id}/messages/${messageId}`,
        { message: { content: editingContent } },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      .then((res) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? res.data : m))
        );
        setEditingId(null);
        setEditingContent('');
      });
  };

  const deleteMessage = (messageId) => {
    axios
      .delete(
        `http://localhost:3000/api/v1/chat_rooms/${id}/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      .then(() => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eafce3] to-[#bdf2ce] flex flex-col">
      <header className="p-4 border-b border-[#74c99a] bg-white">
        <h2 className="text-2xl font-bold text-[#004b23]">Chat Room</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-start gap-3 bg-white shadow-md p-4 rounded-xl relative"
          >
            {msg.sender_avatar_url && (
              <img
                src={msg.sender_avatar_url}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover border border-green-300"
              />
            )}

            <div className="flex-1">
              <p className="text-sm text-[#50a33c] font-semibold mb-1">{msg.sender_email}</p>

              {editingId === msg.id ? (
                <>
                  <input
                    className="w-full p-2 rounded text-black border mb-2"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                  <div className="space-x-2 text-sm">
                    <button
                      className="text-green-600 hover:underline"
                      onClick={() => handleEdit(msg.id)}
                    >
                      Save
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {msg.image_url ? (
                    <img
                      src={msg.image_url}
                      alt="uploaded"
                      className="mt-2 rounded-lg max-w-xs object-cover"
                    />
                  ) : (
                    <p className="text-[#004b23] mb-1">{msg.content}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </div>

                  {user?.email === msg.sender_email && (
                    <div className="absolute top-2 right-3 text-xs space-x-2">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => startEdit(msg)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => deleteMessage(msg.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#74c99a] bg-white flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message"
          className="flex-1 px-4 py-2 rounded border border-[#b5e3b4] text-[#004b23] bg-[#f6fff4]"
        />
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          className="text-sm text-[#004b23]"
        />
        <button
          onClick={sendMessage}
          className="bg-[#50a33c] hover:bg-[#74c99a] text-white px-4 py-2 rounded font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
