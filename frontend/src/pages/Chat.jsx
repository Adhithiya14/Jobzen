import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Paperclip, ArrowDown } from 'lucide-react';
import '../index.css';

export default function Chat() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hello! I am JobZen AI. Use the button below to upload your resume or just tell me what role you are targeting.' }
    ]);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Auto-scroll on new message
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            // Show button if user is scrolled up more than 100px from bottom
            setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Prepare context for backend
        const lastMessages = messages.slice(-10); // Last 10 messages for context

        try {
            const response = await fetch('http://localhost:8001/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    history: [...lastMessages, userMsg]
                }),
            });

            if (!response.ok) throw new Error('Stream request failed');

            // Add placeholder bot message
            setMessages(prev => [...prev, { role: 'bot', text: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                // Update the last message (the placeholder)
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = accumulatedText;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'bot', text: "Error: Could not connect to backend." }]);
        }
    };

    return (
        <div className="chat-container">
            <div
                className="chat-history"
                ref={chatContainerRef}
                onScroll={handleScroll}
            >
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <div className="avatar">
                            {msg.role === 'bot' ? <Bot size={20} /> : <User size={20} />}
                        </div>
                        <div className="bubble">{msg.text}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    style={{
                        position: 'absolute',
                        bottom: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 10,
                        animation: 'fadeIn 0.2s'
                    }}
                >
                    <ArrowDown size={20} />
                </button>
            )}

            <div className="chat-input-area">
                <button className="icon-btn" title="Upload Resume">
                    <Paperclip size={20} />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your message..."
                />
                <button className="icon-btn primary" onClick={handleSend}>
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
