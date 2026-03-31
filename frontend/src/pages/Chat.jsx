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
        <div className="chat-container" style={{ background: 'transparent' }}>
            <div
                className="chat-history"
                ref={chatContainerRef}
                onScroll={handleScroll}
                style={{ paddingTop: '5rem', paddingBottom: '2rem' }}
            >
                <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role}`} style={{ 
                            alignSelf: msg.role === 'bot' ? 'flex-start' : 'flex-end',
                            flexDirection: msg.role === 'bot' ? 'row' : 'row-reverse',
                            maxWidth: '85%'
                        }}>
                            <div className="avatar" style={{ 
                                background: msg.role === 'bot' ? 'rgba(139, 92, 246, 0.1)' : 'var(--primary)',
                                color: msg.role === 'bot' ? 'var(--primary)' : 'white',
                                border: msg.role === 'bot' ? '1px solid rgba(139, 92, 246, 0.2)' : 'none',
                                boxShadow: msg.role === 'user' ? '0 4px 12px var(--primary-glow)' : 'none'
                            }}>
                                {msg.role === 'bot' ? <Bot size={18} /> : <User size={18} />}
                            </div>
                            <div className="bubble" style={{ 
                                background: msg.role === 'bot' ? 'var(--bg-card)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                                color: msg.role === 'bot' ? 'var(--text-primary)' : 'white',
                                borderRadius: '18px',
                                borderTopLeftRadius: msg.role === 'bot' ? '4px' : '18px',
                                borderTopRightRadius: msg.role === 'user' ? '4px' : '18px',
                                boxShadow: 'var(--shadow-lg)',
                                border: msg.role === 'bot' ? '1px solid var(--glass-border)' : 'none',
                                padding: '1.25rem 1.5rem',
                                fontSize: '1.05rem',
                                lineHeight: '1.6'
                            }}>
                                {msg.text || (
                                    <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
                                        <div className="spin" style={{ width: '8px', height: '8px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                                        <div className="spin" style={{ width: '8px', height: '8px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.2s' }}></div>
                                        <div className="spin" style={{ width: '8px', height: '8px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.4s' }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="icon-btn primary"
                    style={{
                        position: 'absolute',
                        bottom: '120px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                        zIndex: 100,
                        backgroundColor: 'var(--primary)'
                    }}
                >
                    <ArrowDown size={22} />
                </button>
            )}

            <div className="chat-input-area" style={{ 
                maxWidth: '800px', 
                margin: '2rem auto', 
                width: 'calc(100% - 4rem)',
                borderRadius: '24px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(16px)',
                padding: '0.75rem 1rem',
                position: 'relative',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
            }}>
                <button className="icon-btn" style={{ color: 'var(--text-muted)' }}>
                    <Paperclip size={20} />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask JobZen anything..."
                    style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        boxShadow: 'none',
                        fontSize: '1.1rem',
                        padding: '0.75rem'
                    }}
                />
                <button 
                    className="icon-btn" 
                    onClick={handleSend}
                    style={{ 
                        background: input.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: input.trim() ? 'white' : 'var(--text-muted)',
                        borderRadius: '16px',
                        padding: '0.75rem',
                        transition: 'all 0.3s'
                    }}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
