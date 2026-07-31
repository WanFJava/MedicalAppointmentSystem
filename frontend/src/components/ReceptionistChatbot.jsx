import { useEffect, useRef, useState } from 'react';
import { Bot, ExternalLink, MessageCircle, Send, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendChatbotMessage } from '../api/chatbotApi';

const INITIAL_MESSAGE = {
    id: 1,
    role: 'assistant',
    text: 'Xin chào! Tôi là trợ lý lễ tân của Smart Clinic. Tôi có thể giúp bạn tìm bác sĩ, xem chuyên khoa, kiểm tra lịch trống và hướng dẫn đặt lịch.',
    quickReplies: ['Tìm bác sĩ', 'Xem chuyên khoa', 'Đặt lịch khám', 'Lịch hẹn của tôi'],
    actions: []
};

const ReceptionistChatbot = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const nextId = useRef(2);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isSending]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const addMessage = (message) => {
        setMessages((currentMessages) => [
            ...currentMessages,
            { id: nextId.current++, ...message }
        ]);
    };

    const handleSend = async (presetMessage) => {
        const text = (presetMessage ?? input).trim();
        if (!text || isSending) return;

        addMessage({
            role: 'user',
            text,
            quickReplies: [],
            actions: []
        });
        setInput('');
        setIsSending(true);

        try {
            const response = await sendChatbotMessage(text);
            addMessage({
                role: 'assistant',
                text: response.message,
                quickReplies: response.quickReplies || [],
                actions: response.actions || []
            });
        } catch (requestError) {
            addMessage({
                role: 'assistant',
                text: requestError.response?.data?.message
                    || 'Xin lỗi, lễ tân trực tuyến đang tạm gián đoạn. Bạn vui lòng thử lại sau.',
                quickReplies: ['Thử lại', 'Liên hệ hỗ trợ'],
                actions: []
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleAction = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <>
            {isOpen && (
                <section
                    aria-label="Smart Clinic receptionist chatbot"
                    style={{
                        position: 'fixed',
                        right: '1.5rem',
                        bottom: '6rem',
                        width: 'min(390px, calc(100vw - 2rem))',
                        height: 'min(610px, calc(100vh - 7.5rem))',
                        zIndex: 1000,
                        backgroundColor: 'white',
                        border: '1px solid #dbeafe',
                        borderRadius: '1.25rem',
                        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <header style={{
                        padding: '1rem 1.25rem',
                        background: 'linear-gradient(135deg, #4f46e5, #0284c7)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Bot size={23} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Lễ tân Smart Clinic</div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    fontSize: '0.78rem',
                                    opacity: 0.9
                                }}>
                                    <span style={{
                                        width: '7px',
                                        height: '7px',
                                        borderRadius: '50%',
                                        backgroundColor: '#86efac'
                                    }} />
                                    Trực tuyến
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            aria-label="Đóng chatbot"
                            onClick={() => setIsOpen(false)}
                            style={{
                                border: 'none',
                                backgroundColor: 'rgba(255,255,255,0.14)',
                                color: 'white',
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={19} />
                        </button>
                    </header>

                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.9rem'
                    }}>
                        {messages.map((message, index) => {
                            const isAssistant = message.role === 'assistant';
                            const isLatestMessage = index === messages.length - 1;
                            return (
                                <div
                                    key={message.id}
                                    style={{
                                        display: 'flex',
                                        gap: '0.55rem',
                                        alignItems: 'flex-start',
                                        flexDirection: isAssistant ? 'row' : 'row-reverse'
                                    }}
                                >
                                    <div style={{
                                        flexShrink: 0,
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isAssistant ? '#e0e7ff' : '#dbeafe',
                                        color: isAssistant ? '#4f46e5' : '#2563eb'
                                    }}>
                                        {isAssistant ? <Bot size={16} /> : <User size={16} />}
                                    </div>

                                    <div style={{
                                        maxWidth: '82%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.6rem',
                                        alignItems: isAssistant ? 'flex-start' : 'flex-end'
                                    }}>
                                        <div style={{
                                            padding: '0.75rem 0.9rem',
                                            borderRadius: isAssistant
                                                ? '0.25rem 1rem 1rem 1rem'
                                                : '1rem 0.25rem 1rem 1rem',
                                            backgroundColor: isAssistant ? 'white' : '#4f46e5',
                                            color: isAssistant ? '#334155' : 'white',
                                            boxShadow: isAssistant
                                                ? '0 1px 3px rgba(15, 23, 42, 0.08)'
                                                : 'none',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.55,
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {message.text}
                                        </div>

                                        {message.actions?.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {message.actions.map((action) => (
                                                    <button
                                                        key={`${message.id}-${action.path}-${action.label}`}
                                                        type="button"
                                                        onClick={() => handleAction(action.path)}
                                                        style={{
                                                            padding: '0.45rem 0.65rem',
                                                            border: '1px solid #c7d2fe',
                                                            borderRadius: '0.6rem',
                                                            backgroundColor: '#eef2ff',
                                                            color: '#4338ca',
                                                            fontWeight: 700,
                                                            fontSize: '0.78rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.3rem'
                                                        }}
                                                    >
                                                        {action.label}
                                                        <ExternalLink size={12} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {isLatestMessage && message.quickReplies?.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {message.quickReplies.map((reply) => (
                                                    <button
                                                        key={`${message.id}-${reply}`}
                                                        type="button"
                                                        disabled={isSending}
                                                        onClick={() => handleSend(reply)}
                                                        style={{
                                                            padding: '0.4rem 0.65rem',
                                                            border: '1px solid #bae6fd',
                                                            borderRadius: '999px',
                                                            backgroundColor: 'white',
                                                            color: '#0369a1',
                                                            fontWeight: 600,
                                                            fontSize: '0.76rem',
                                                            cursor: isSending ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        {reply}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {isSending && (
                            <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    backgroundColor: '#e0e7ff',
                                    color: '#4f46e5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Bot size={16} />
                                </div>
                                <div style={{
                                    padding: '0.65rem 0.9rem',
                                    backgroundColor: 'white',
                                    borderRadius: '0.25rem 1rem 1rem 1rem',
                                    color: '#64748b',
                                    letterSpacing: '0.2rem'
                                }}>
                                    •••
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                        <div style={{
                            padding: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.55rem'
                        }}>
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isSending}
                                maxLength={500}
                                aria-label="Nhập câu hỏi cho lễ tân"
                                placeholder="Nhập câu hỏi..."
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '0.75rem',
                                    padding: '0.7rem 0.8rem',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button
                                type="button"
                                aria-label="Gửi tin nhắn"
                                disabled={isSending || !input.trim()}
                                onClick={() => handleSend()}
                                style={{
                                    flexShrink: 0,
                                    width: '40px',
                                    height: '40px',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    backgroundColor: isSending || !input.trim() ? '#cbd5e1' : '#4f46e5',
                                    color: 'white',
                                    cursor: isSending || !input.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div style={{
                            padding: '0 0.75rem 0.65rem',
                            textAlign: 'center',
                            color: '#94a3b8',
                            fontSize: '0.68rem'
                        }}>
                            Không sử dụng chatbot cho tình huống cấp cứu.
                        </div>
                    </div>
                </section>
            )}

            <button
                type="button"
                aria-label={isOpen ? 'Đóng lễ tân trực tuyến' : 'Mở lễ tân trực tuyến'}
                onClick={() => setIsOpen((currentValue) => !currentValue)}
                style={{
                    position: 'fixed',
                    right: '1.5rem',
                    bottom: '1.5rem',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5, #0284c7)',
                    color: 'white',
                    boxShadow: '0 12px 28px rgba(79, 70, 229, 0.35)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001
                }}
            >
                {isOpen ? <X size={25} /> : <MessageCircle size={27} />}
                {!isOpen && (
                    <span style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        border: '2px solid white'
                    }} />
                )}
            </button>
        </>
    );
};

export default ReceptionistChatbot;
