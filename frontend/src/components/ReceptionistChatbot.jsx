import { useContext, useEffect, useRef, useState } from 'react';
import {
    Bot,
    ExternalLink,
    Headphones,
    MessageCircle,
    RotateCcw,
    Send,
    User,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { sendChatbotMessage } from '../api/chatbotApi';
import {
    closeCustomerLiveChat,
    createCustomerLiveChat,
    getCustomerLiveChat,
    sendCustomerLiveChatMessage
} from '../api/liveChatApi';
import './ReceptionistChatbot.css';

const LIVE_CHAT_STORAGE_KEY = 'smartClinicLiveChat';

const INITIAL_MESSAGE = {
    id: 1,
    role: 'assistant',
    text: 'Xin chào! Tôi là trợ lý lễ tân của Smart Clinic. Tôi có thể giúp bạn tìm bác sĩ, xem chuyên khoa, kiểm tra lịch trống và hướng dẫn đặt lịch.',
    quickReplies: ['Tìm bác sĩ', 'Xem chuyên khoa', 'Đặt lịch khám', 'Lịch hẹn của tôi'],
    actions: []
};

const readStoredCredentials = () => {
    try {
        const value = sessionStorage.getItem(LIVE_CHAT_STORAGE_KEY);
        return value ? JSON.parse(value) : null;
    } catch {
        sessionStorage.removeItem(LIVE_CHAT_STORAGE_KEY);
        return null;
    }
};

const ReceptionistChatbot = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState('bot');
    const [botMessages, setBotMessages] = useState([INITIAL_MESSAGE]);
    const [liveSession, setLiveSession] = useState(null);
    const [liveCredentials, setLiveCredentials] = useState(readStoredCredentials);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [liveError, setLiveError] = useState('');
    const nextId = useRef(2);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const applyLiveSession = (session) => {
        setLiveSession(session);
        setMode('live');
        setLiveError('');
    };

    const saveLiveCredentials = (session) => {
        const credentials = {
            sessionId: session.id,
            accessToken: session.accessToken
        };
        sessionStorage.setItem(
            LIVE_CHAT_STORAGE_KEY,
            JSON.stringify(credentials)
        );
        setLiveCredentials(credentials);
    };

    useEffect(() => {
        if (!liveCredentials) return;

        let cancelled = false;
        getCustomerLiveChat(
            liveCredentials.sessionId,
            liveCredentials.accessToken
        )
            .then((session) => {
                if (!cancelled) {
                    applyLiveSession(session);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    sessionStorage.removeItem(LIVE_CHAT_STORAGE_KEY);
                    setLiveCredentials(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [liveCredentials]);

    useEffect(() => {
        if (
            mode !== 'live'
            || !liveCredentials
            || liveSession?.status === 'CLOSED'
        ) {
            return undefined;
        }

        let polling = false;
        const pollSession = async () => {
            if (polling) return;
            polling = true;
            try {
                const session = await getCustomerLiveChat(
                    liveCredentials.sessionId,
                    liveCredentials.accessToken
                );
                applyLiveSession(session);
            } catch {
                setLiveError('Không thể cập nhật hội thoại. Hệ thống sẽ tự thử lại.');
            } finally {
                polling = false;
            }
        };

        const intervalId = window.setInterval(pollSession, 2000);
        return () => window.clearInterval(intervalId);
    }, [
        liveCredentials,
        liveSession?.status,
        mode
    ]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [botMessages, liveSession, isOpen, isSending]);

    useEffect(() => {
        if (isOpen && liveSession?.status !== 'CLOSED') {
            inputRef.current?.focus();
        }
    }, [isOpen, mode, liveSession?.status]);

    const addBotMessage = (message) => {
        setBotMessages((currentMessages) => [
            ...currentMessages,
            { id: nextId.current++, ...message }
        ]);
    };

    const startLiveHandoff = async (initialMessage) => {
        const session = await createCustomerLiveChat({
            customerName: user?.fullName || 'Khách hàng',
            initialMessage
        });
        saveLiveCredentials(session);
        applyLiveSession(session);
    };

    const handleBotSend = async (text) => {
        addBotMessage({
            role: 'user',
            text,
            quickReplies: [],
            actions: []
        });

        const response = await sendChatbotMessage(text);
        if (response.handoffRequested) {
            await startLiveHandoff(text);
            return;
        }

        addBotMessage({
            role: 'assistant',
            text: response.message,
            quickReplies: response.quickReplies || [],
            actions: response.actions || []
        });
    };

    const handleLiveSend = async (text) => {
        if (!liveCredentials || liveSession?.status === 'CLOSED') return;
        const session = await sendCustomerLiveChatMessage(
            liveCredentials.sessionId,
            liveCredentials.accessToken,
            text
        );
        applyLiveSession(session);
    };

    const handleSend = async (presetMessage) => {
        const text = (presetMessage ?? input).trim();
        if (!text || isSending) return;

        setInput('');
        setIsSending(true);
        setLiveError('');
        try {
            if (mode === 'live') {
                await handleLiveSend(text);
            } else {
                await handleBotSend(text);
            }
        } catch (requestError) {
            if (mode === 'live') {
                setLiveError(
                    requestError.response?.data?.message
                    || 'Không thể gửi tin nhắn. Vui lòng thử lại.'
                );
            } else {
                addBotMessage({
                    role: 'assistant',
                    text: requestError.response?.data?.message
                        || 'Xin lỗi, lễ tân trực tuyến đang tạm gián đoạn. Bạn vui lòng thử lại sau.',
                    quickReplies: ['Thử lại', 'Liên hệ hỗ trợ'],
                    actions: []
                });
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleCloseLiveSession = async () => {
        if (!liveCredentials || liveSession?.status === 'CLOSED') return;
        setIsSending(true);
        try {
            const session = await closeCustomerLiveChat(
                liveCredentials.sessionId,
                liveCredentials.accessToken
            );
            applyLiveSession(session);
        } catch (requestError) {
            setLiveError(
                requestError.response?.data?.message
                || 'Không thể kết thúc hội thoại.'
            );
        } finally {
            setIsSending(false);
        }
    };

    const returnToChatbot = () => {
        sessionStorage.removeItem(LIVE_CHAT_STORAGE_KEY);
        setLiveCredentials(null);
        setLiveSession(null);
        setLiveError('');
        setBotMessages([INITIAL_MESSAGE]);
        setMode('bot');
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

    const statusText = mode === 'bot'
        ? 'Chatbot tự động'
        : liveSession?.status === 'WAITING'
            ? 'Đang chờ lễ tân tiếp nhận'
            : liveSession?.status === 'ACTIVE'
                ? `Đang chat với ${liveSession.assignedReceptionistName || 'lễ tân'}`
                : 'Hội thoại đã kết thúc';

    const displayedMessages = mode === 'bot'
        ? botMessages
        : liveSession?.messages || [];
    const isClosed = mode === 'live' && liveSession?.status === 'CLOSED';

    return (
        <>
            {isOpen && (
                <section
                    aria-label={mode === 'bot'
                        ? 'Smart Clinic receptionist chatbot'
                        : 'Smart Clinic live receptionist chat'}
                    className="reception-chat"
                >
                    <header className={`reception-chat__header reception-chat__header--${mode}`}>
                        <div className="reception-chat__identity">
                            <div className="reception-chat__avatar">
                                {mode === 'bot'
                                    ? <Bot size={23} />
                                    : <Headphones size={23} />}
                            </div>
                            <div>
                                <div className="reception-chat__title">
                                    {mode === 'bot'
                                        ? 'Trợ lý Smart Clinic'
                                        : 'Lễ tân trực tiếp'}
                                </div>
                                <div className="reception-chat__status">
                                    <span
                                        className={`reception-chat__status-dot reception-chat__status-dot--${mode === 'bot' ? 'active' : (liveSession?.status || 'WAITING').toLowerCase()}`}
                                    />
                                    {statusText}
                                </div>
                            </div>
                        </div>
                        <div className="reception-chat__header-actions">
                            {mode === 'live' && !isClosed && (
                                <button
                                    type="button"
                                    onClick={handleCloseLiveSession}
                                    disabled={isSending}
                                    className="reception-chat__end-button"
                                >
                                    Kết thúc
                                </button>
                            )}
                            <button
                                type="button"
                                aria-label="Đóng cửa sổ chat"
                                onClick={() => setIsOpen(false)}
                                className="reception-chat__icon-button"
                            >
                                <X size={19} />
                            </button>
                        </div>
                    </header>

                    <div className="reception-chat__messages">
                        {mode === 'live' && liveSession?.status === 'WAITING' && (
                            <div className="reception-chat__notice">
                                Yêu cầu của bạn đã vào hàng chờ. Bạn vẫn có thể gửi
                                thêm thông tin trong lúc đợi lễ tân.
                            </div>
                        )}

                        {displayedMessages.map((message, index) => {
                            const isSystem = mode === 'live'
                                && message.senderType === 'SYSTEM';
                            if (isSystem) {
                                return (
                                    <div
                                        key={message.id}
                                        className="reception-chat__system-message"
                                    >
                                        {message.content}
                                    </div>
                                );
                            }

                            const isCustomer = mode === 'live'
                                ? message.senderType === 'CUSTOMER'
                                : message.role === 'user';
                            const text = mode === 'live'
                                ? message.content
                                : message.text;
                            const isLatestMessage = index === displayedMessages.length - 1;

                            return (
                                <div
                                    key={message.id}
                                    className={`reception-chat__row ${isCustomer ? 'reception-chat__row--customer' : ''}`}
                                >
                                    <div className={`reception-chat__message-avatar ${isCustomer ? 'reception-chat__message-avatar--customer' : ''}`}>
                                        {isCustomer
                                            ? <User size={16} />
                                            : mode === 'bot'
                                                ? <Bot size={16} />
                                                : <Headphones size={16} />}
                                    </div>

                                    <div className={`reception-chat__message-content ${isCustomer ? 'reception-chat__message-content--customer' : ''}`}>
                                        {mode === 'live' && !isCustomer && (
                                            <span className="reception-chat__sender-name">
                                                {message.senderName}
                                            </span>
                                        )}
                                        <div className={`reception-chat__bubble ${isCustomer ? 'reception-chat__bubble--customer' : ''}`}>
                                            {text}
                                        </div>

                                        {mode === 'bot' && message.actions?.length > 0 && (
                                            <div className="reception-chat__actions">
                                                {message.actions.map((action) => (
                                                    <button
                                                        key={`${message.id}-${action.path}-${action.label}`}
                                                        type="button"
                                                        onClick={() => handleAction(action.path)}
                                                        className="reception-chat__action-button"
                                                    >
                                                        {action.label}
                                                        <ExternalLink size={12} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {mode === 'bot'
                                            && isLatestMessage
                                            && message.quickReplies?.length > 0 && (
                                            <div className="reception-chat__quick-replies">
                                                {message.quickReplies.map((reply) => (
                                                    <button
                                                        key={`${message.id}-${reply}`}
                                                        type="button"
                                                        disabled={isSending}
                                                        onClick={() => handleSend(reply)}
                                                        className="reception-chat__quick-reply"
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
                            <div className="reception-chat__row">
                                <div className="reception-chat__message-avatar">
                                    {mode === 'bot'
                                        ? <Bot size={16} />
                                        : <Headphones size={16} />}
                                </div>
                                <div className="reception-chat__typing">•••</div>
                            </div>
                        )}

                        {liveError && (
                            <div className="reception-chat__error">{liveError}</div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="reception-chat__footer">
                        {isClosed ? (
                            <button
                                type="button"
                                onClick={returnToChatbot}
                                className="reception-chat__return-button"
                            >
                                <RotateCcw size={16} />
                                Quay lại chatbot
                            </button>
                        ) : (
                            <div className="reception-chat__composer">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isSending}
                                    maxLength={mode === 'bot' ? 500 : 1000}
                                    aria-label={mode === 'bot'
                                        ? 'Nhập câu hỏi cho chatbot'
                                        : 'Nhập tin nhắn cho lễ tân'}
                                    placeholder={mode === 'bot'
                                        ? 'Nhập câu hỏi...'
                                        : 'Nhắn tin cho lễ tân...'}
                                />
                                <button
                                    type="button"
                                    aria-label="Gửi tin nhắn"
                                    disabled={isSending || !input.trim()}
                                    onClick={() => handleSend()}
                                    className="reception-chat__send-button"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        )}

                        {mode === 'bot' ? (
                            <div className="reception-chat__handoff">
                                <span>Chatbot chưa giải quyết được?</span>
                                <button
                                    type="button"
                                    disabled={isSending}
                                    onClick={() => handleSend('Tôi cần nói chuyện với lễ tân')}
                                >
                                    <Headphones size={14} />
                                    Nói chuyện với lễ tân
                                </button>
                            </div>
                        ) : (
                            <div className="reception-chat__live-note">
                                Hội thoại trực tiếp được lưu để lễ tân hỗ trợ liên tục.
                            </div>
                        )}
                        <div className="reception-chat__emergency-note">
                            Không sử dụng chat cho tình huống cấp cứu.
                        </div>
                    </div>
                </section>
            )}

            <button
                type="button"
                aria-label={isOpen ? 'Đóng lễ tân trực tuyến' : 'Mở lễ tân trực tuyến'}
                onClick={() => setIsOpen((currentValue) => !currentValue)}
                className={`reception-chat__launcher ${mode === 'live' ? 'reception-chat__launcher--live' : ''}`}
            >
                {isOpen
                    ? <X size={25} />
                    : mode === 'live'
                        ? <Headphones size={27} />
                        : <MessageCircle size={27} />}
                {!isOpen && (
                    <span className={`reception-chat__launcher-dot ${liveSession?.status === 'WAITING' ? 'reception-chat__launcher-dot--waiting' : ''}`} />
                )}
            </button>
        </>
    );
};

export default ReceptionistChatbot;
