import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Check,
    Clock3,
    Headphones,
    MessageSquare,
    RefreshCw,
    Send,
    UserRound,
    X
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import {
    claimReceptionistLiveChat,
    closeReceptionistLiveChat,
    getReceptionistLiveChat,
    getReceptionistLiveChats,
    sendReceptionistLiveChatMessage
} from '../../api/liveChatApi';
import './LiveChatDashboard.css';

const formatTime = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
    }).format(new Date(value));
};

const statusLabel = {
    WAITING: 'Đang chờ',
    ACTIVE: 'Đang xử lý',
    CLOSED: 'Đã kết thúc'
};

const LiveChatDashboard = () => {
    const { user } = useContext(AuthContext);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [includeClosed, setIncludeClosed] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    const loadSessions = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getReceptionistLiveChats(includeClosed);
            setSessions(data);
            setError('');
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                || 'Không thể tải danh sách chat trực tiếp.'
            );
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [includeClosed]);

    const loadSelectedSession = useCallback(async (sessionId) => {
        if (!sessionId) return;
        try {
            const data = await getReceptionistLiveChat(sessionId);
            setSelectedSession(data);
            setError('');
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                || 'Không thể tải nội dung hội thoại.'
            );
        }
    }, []);

    useEffect(() => {
        loadSessions(true);
        const intervalId = window.setInterval(() => loadSessions(false), 2500);
        return () => window.clearInterval(intervalId);
    }, [loadSessions]);

    useEffect(() => {
        if (!selectedSession?.id) return undefined;
        const sessionId = selectedSession.id;
        const intervalId = window.setInterval(
            () => loadSelectedSession(sessionId),
            2000
        );
        return () => window.clearInterval(intervalId);
    }, [loadSelectedSession, selectedSession?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedSession?.messages]);

    const selectSession = async (sessionId) => {
        setWorking(true);
        await loadSelectedSession(sessionId);
        setWorking(false);
    };

    const refreshAll = async () => {
        setWorking(true);
        await Promise.all([
            loadSessions(false),
            selectedSession?.id
                ? loadSelectedSession(selectedSession.id)
                : Promise.resolve()
        ]);
        setWorking(false);
    };

    const claimSession = async () => {
        if (!selectedSession) return;
        setWorking(true);
        try {
            const data = await claimReceptionistLiveChat(selectedSession.id);
            setSelectedSession(data);
            await loadSessions(false);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                || 'Không thể nhận phiên chat này.'
            );
        } finally {
            setWorking(false);
        }
    };

    const sendMessage = async () => {
        const content = message.trim();
        if (!content || !selectedSession || working) return;

        setWorking(true);
        setMessage('');
        try {
            const data = await sendReceptionistLiveChatMessage(
                selectedSession.id,
                content
            );
            setSelectedSession(data);
            await loadSessions(false);
        } catch (requestError) {
            setMessage(content);
            setError(
                requestError.response?.data?.message
                || 'Không thể gửi tin nhắn.'
            );
        } finally {
            setWorking(false);
        }
    };

    const closeSession = async () => {
        if (!selectedSession || working) return;
        setWorking(true);
        try {
            const data = await closeReceptionistLiveChat(selectedSession.id);
            setSelectedSession(data);
            await loadSessions(false);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                || 'Không thể kết thúc phiên chat.'
            );
        } finally {
            setWorking(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    const assignedToAnotherReceptionist = selectedSession?.assignedReceptionistId
        && selectedSession.assignedReceptionistId !== user?.id
        && user?.role !== 'ADMIN';
    const canReply = selectedSession?.status === 'ACTIVE'
        && !assignedToAnotherReceptionist;
    const waitingCount = sessions.filter(
        (session) => session.status === 'WAITING'
    ).length;

    return (
        <div className="live-chat-page">
            <div className="page-header live-chat-page__header">
                <div>
                    <h2>Live Chat</h2>
                    <p>Hỗ trợ khách hàng trực tiếp từ chatbot Smart Clinic.</p>
                </div>
                <div className="live-chat-page__summary">
                    <span>
                        <Clock3 size={16} />
                        {waitingCount} khách đang chờ
                    </span>
                    <button
                        type="button"
                        onClick={refreshAll}
                        disabled={working}
                        aria-label="Làm mới danh sách chat"
                    >
                        <RefreshCw size={17} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="live-chat-page__error">{error}</div>
            )}

            <div className="live-chat-workspace">
                <aside className="live-chat-list">
                    <div className="live-chat-list__header">
                        <div>
                            <strong>Hội thoại</strong>
                            <span>{sessions.length} phiên</span>
                        </div>
                        <label>
                            <input
                                type="checkbox"
                                checked={includeClosed}
                                onChange={(event) => setIncludeClosed(event.target.checked)}
                            />
                            Đã đóng
                        </label>
                    </div>

                    <div className="live-chat-list__items">
                        {loading && (
                            <div className="live-chat-list__empty">
                                Đang tải hội thoại...
                            </div>
                        )}
                        {!loading && sessions.length === 0 && (
                            <div className="live-chat-list__empty">
                                <MessageSquare size={30} />
                                <strong>Chưa có khách chờ</strong>
                                <span>Yêu cầu mới sẽ xuất hiện tại đây.</span>
                            </div>
                        )}
                        {sessions.map((session) => (
                            <button
                                key={session.id}
                                type="button"
                                onClick={() => selectSession(session.id)}
                                className={`live-chat-card ${selectedSession?.id === session.id ? 'live-chat-card--selected' : ''}`}
                            >
                                <div className="live-chat-card__avatar">
                                    {session.customerName?.charAt(0)?.toUpperCase() || 'K'}
                                </div>
                                <div className="live-chat-card__body">
                                    <div className="live-chat-card__topline">
                                        <strong>{session.customerName}</strong>
                                        <span>{formatTime(session.lastMessageAt)}</span>
                                    </div>
                                    <div className="live-chat-card__meta">
                                        <span className={`live-chat-status live-chat-status--${session.status.toLowerCase()}`}>
                                            {statusLabel[session.status]}
                                        </span>
                                        {session.assignedReceptionistName && (
                                            <span className="live-chat-card__assignee">
                                                {session.assignedReceptionistName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="live-chat-conversation">
                    {!selectedSession ? (
                        <div className="live-chat-conversation__empty">
                            <Headphones size={44} />
                            <h3>Chọn một hội thoại</h3>
                            <p>Nhận khách đang chờ và trả lời ngay tại đây.</p>
                        </div>
                    ) : (
                        <>
                            <header className="live-chat-conversation__header">
                                <div className="live-chat-conversation__customer">
                                    <div className="live-chat-card__avatar">
                                        {selectedSession.customerName?.charAt(0)?.toUpperCase() || 'K'}
                                    </div>
                                    <div>
                                        <strong>{selectedSession.customerName}</strong>
                                        <span>
                                            Phiên #{selectedSession.id} · {statusLabel[selectedSession.status]}
                                        </span>
                                    </div>
                                </div>
                                <div className="live-chat-conversation__actions">
                                    {selectedSession.status === 'WAITING' && (
                                        <button
                                            type="button"
                                            onClick={claimSession}
                                            disabled={working}
                                            className="live-chat-button live-chat-button--accept"
                                        >
                                            <Check size={16} />
                                            Nhận chat
                                        </button>
                                    )}
                                    {selectedSession.status === 'ACTIVE'
                                        && !assignedToAnotherReceptionist && (
                                        <button
                                            type="button"
                                            onClick={closeSession}
                                            disabled={working}
                                            className="live-chat-button live-chat-button--close"
                                        >
                                            <X size={16} />
                                            Kết thúc
                                        </button>
                                    )}
                                </div>
                            </header>

                            {assignedToAnotherReceptionist && (
                                <div className="live-chat-conversation__ownership">
                                    Phiên này đang do {selectedSession.assignedReceptionistName} phụ trách.
                                </div>
                            )}

                            <div className="live-chat-conversation__messages">
                                {selectedSession.messages?.map((chatMessage) => {
                                    if (chatMessage.senderType === 'SYSTEM') {
                                        return (
                                            <div
                                                key={chatMessage.id}
                                                className="live-chat-conversation__system"
                                            >
                                                {chatMessage.content}
                                            </div>
                                        );
                                    }

                                    const fromReceptionist =
                                        chatMessage.senderType === 'RECEPTIONIST';
                                    return (
                                        <div
                                            key={chatMessage.id}
                                            className={`live-chat-conversation__row ${fromReceptionist ? 'live-chat-conversation__row--staff' : ''}`}
                                        >
                                            <div className="live-chat-conversation__message-avatar">
                                                {fromReceptionist
                                                    ? <Headphones size={16} />
                                                    : <UserRound size={16} />}
                                            </div>
                                            <div className="live-chat-conversation__message">
                                                <span>{chatMessage.senderName}</span>
                                                <div>{chatMessage.content}</div>
                                                <time>{formatTime(chatMessage.createdAt)}</time>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <footer className="live-chat-conversation__composer">
                                {selectedSession.status === 'CLOSED' ? (
                                    <div className="live-chat-conversation__closed">
                                        Hội thoại này đã kết thúc.
                                    </div>
                                ) : selectedSession.status === 'WAITING' ? (
                                    <button
                                        type="button"
                                        onClick={claimSession}
                                        disabled={working}
                                        className="live-chat-button live-chat-button--accept live-chat-button--wide"
                                    >
                                        <Check size={17} />
                                        Nhận phiên để bắt đầu trả lời
                                    </button>
                                ) : (
                                    <>
                                        <textarea
                                            value={message}
                                            onChange={(event) => setMessage(event.target.value)}
                                            onKeyDown={handleKeyDown}
                                            disabled={!canReply || working}
                                            maxLength={1000}
                                            aria-label="Nhập phản hồi cho khách hàng"
                                            placeholder="Nhập phản hồi cho khách hàng..."
                                        />
                                        <button
                                            type="button"
                                            onClick={sendMessage}
                                            disabled={!canReply || working || !message.trim()}
                                            aria-label="Gửi phản hồi cho khách hàng"
                                        >
                                            <Send size={19} />
                                        </button>
                                    </>
                                )}
                            </footer>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default LiveChatDashboard;
