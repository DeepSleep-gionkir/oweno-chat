import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PocketBase from "pocketbase";
import "./App.css";

// ⚠️ [중요] 여기에 본인의 Ngrok 주소를 넣어야 합니다.
const SERVER_URL = "https://untasted-trisha-unplentiful.ngrok-free.dev";
const pb = new PocketBase(SERVER_URL);

function App() {
  const [currentUser, setCurrentUser] = useState(
    pb.authStore.isValid ? pb.authStore.model : null,
  );

  useEffect(() => {
    const removeListener = pb.authStore.onChange(() => {
      setCurrentUser(pb.authStore.isValid ? pb.authStore.model : null);
    });

    if (pb.authStore.isValid) {
      pb.collection("users").authRefresh().catch(() => pb.authStore.clear());
    }

    return () => removeListener();
  }, []);

  const handleLogout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
  };

  return (
    <div className="app-shell">
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="app-card">
        {currentUser ? (
          <ChatRoom currentUser={currentUser} onLogout={handleLogout} />
        ) : (
          <LoginScreen onLogin={setCurrentUser} />
        )}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(email.trim(), password);
      onLogin(authData.record);
    } catch (err) {
      console.error("로그인 실패:", err);
      setError("로그인 실패. 정보를 확인하거나 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className="login-grid">
      <div className="login-hero">
        <div className="pill">Private Lounge</div>
        <h1>
          비밀 채팅 공간,
          <span className="highlight"> Sunset</span>
        </h1>
        <p className="muted">
          따뜻한 석양 톤으로 새로 단장한 공간. 팀과 친구들을 초대해 자유롭게
          이야기하세요.
        </p>
        <div className="hero-foot">
          <div className="status-dot" />
          <span>새로운 테마 · 더 편한 로그인 입력 · 실시간 메시지</span>
        </div>
      </div>

      <div className="login-form">
        <div className="form-head">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>다시 만나 반가워요!</h2>
            <p className="muted">
              아이디와 비밀번호를 입력하고 바로 입장하세요.
            </p>
          </div>
        </div>

        <label className="field">
          <span>아이디 (이메일)</span>
          <input
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </label>

        <label className="field">
          <span>비밀번호</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </label>

        {error && <div className="inline-error">{error}</div>}

        <button
          className="primary-btn"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "입장 준비 중..." : "입장하기"}
        </button>
      </div>
    </div>
  );
}

function ChatRoom({ currentUser, onLogout }) {
  const MESSAGES_PER_PAGE = 100;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const scrollRef = useRef(null);
  const listRef = useRef(null);
  const lastUpdateRef = useRef("new");
  const cacheKey = useMemo(
    () => `chat-cache-${currentUser?.id || "anonymous"}`,
    [currentUser?.id],
  );

  const sortMessages = useCallback(
    (list) =>
      [...list].sort(
        (a, b) => new Date(a.created || 0) - new Date(b.created || 0),
      ),
    [],
  );

  const mergeMessages = useCallback(
    (existing, incoming) => {
      const map = new Map();
      [...existing, ...incoming].forEach((msg) => {
        map.set(msg.id, msg);
      });
      return sortMessages([...map.values()]);
    },
    [sortMessages],
  );

  const readCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch (error) {
      console.error("캐시 읽기 실패:", error);
      return null;
    }
  }, [cacheKey]);

  const writeCache = useCallback(
    (list) => {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch (error) {
        console.error("캐시 저장 실패:", error);
      }
    },
    [cacheKey],
  );

  const upsertMessage = useCallback(
    (incoming) => {
      lastUpdateRef.current = "new";
      setMessages((prev) => {
        const merged = mergeMessages(prev, [incoming]);
        writeCache(merged);
        return merged;
      });
    },
    [mergeMessages, writeCache],
  );

  const loadOlder = useCallback(async () => {
    if (!hasMore || isLoadingOlder || nextPage <= 1) return;
    const listEl = listRef.current;
    const prevHeight = listEl?.scrollHeight ?? 0;
    const prevTop = listEl?.scrollTop ?? 0;

    setIsLoadingOlder(true);
    lastUpdateRef.current = "older";

    try {
      const res = await pb.collection("messages").getList(
        nextPage,
        MESSAGES_PER_PAGE,
        { sort: "-created", expand: "author" },
      );
      setHasMore(res.page < res.totalPages);
      setNextPage(res.page + 1);
      setMessages((prev) => {
        const merged = mergeMessages(res.items, prev);
        writeCache(merged);
        return merged;
      });

      requestAnimationFrame(() => {
        const el = listRef.current;
        if (el) {
          const newHeight = el.scrollHeight;
          el.scrollTop = prevTop + (newHeight - prevHeight);
        }
        lastUpdateRef.current = "new";
      });
    } catch (error) {
      console.error("이전 메시지 로드 실패:", error);
      lastUpdateRef.current = "new";
    } finally {
      setIsLoadingOlder(false);
    }
  }, [MESSAGES_PER_PAGE, hasMore, isLoadingOlder, mergeMessages, nextPage, writeCache]);

  useEffect(() => {
    let unsubscribe;
    let active = true;

    const cached = readCache();
    if (cached && active) {
      const sorted = sortMessages(cached);
      setMessages(sorted);
    }

    const fetchAllMessages = async () => {
      try {
        let page = 1;
        let totalPages = 1;
        let all = [];

        do {
          const res = await pb.collection("messages").getList(
            page,
            MESSAGES_PER_PAGE,
            {
              sort: "-created",
              expand: "author",
            },
          );
          totalPages = res.totalPages;
          all = mergeMessages(all, res.items);
          page += 1;
        } while (page <= totalPages && active);

        if (active) {
          const sorted = sortMessages(all);
          setMessages(sorted);
          writeCache(sorted);
          setNextPage(totalPages + 1);
          setHasMore(false);
          lastUpdateRef.current = "new";
        }
      } catch (error) {
        console.error("메시지 불러오기 실패:", error);
      }
    };

    const subscribeMessages = async () => {
      try {
        unsubscribe = await pb.collection("messages").subscribe(
          "*",
          async (event) => {
            if (event.action !== "create") return;
            try {
              const newMsg = await pb
                .collection("messages")
                .getOne(event.record.id, { expand: "author" });
              upsertMessage(newMsg);
            } catch (error) {
              console.error("실시간 메시지 가져오기 실패:", error);
            }
          },
        );
      } catch (error) {
        console.error("실시간 구독 실패:", error);
      }
    };

    fetchAllMessages();
    subscribeMessages();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [MESSAGES_PER_PAGE, mergeMessages, readCache, sortMessages, upsertMessage, writeCache]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop < 80 && hasMore && !isLoadingOlder) {
        loadOlder();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, isLoadingOlder, loadOlder]);

  useEffect(() => {
    if (lastUpdateRef.current === "older") return;
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      const created = await pb.collection("messages").create(
        {
          text,
          author: currentUser.id,
        },
        { expand: "author" },
      );
      upsertMessage(created);
      setInputText("");
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      alert("전송에 실패했어요. 네트워크를 확인해주세요.");
    } finally {
      setIsSending(false);
    }
  };

  const displayName =
    currentUser?.name || currentUser?.username || currentUser?.email || "사용자";
  const currentUserId = currentUser?.id || pb.authStore.model?.id;

  const getSenderName = (msg) => {
    const author =
      msg.expand?.author ||
      (typeof msg.author === "object" ? msg.author : null) ||
      null;
    return (
      author?.name ||
      author?.username ||
      author?.email ||
      "알 수 없음"
    );
  };

  const getAvatarUrl = (record) => {
    if (!record) return null;
    const fileField =
      record.avatar ||
      record.photo ||
      record.profile ||
      record.image ||
      record.picture;
    if (!fileField) return null;
    try {
      return pb.files.getUrl(record, fileField, { thumb: "100x100" });
    } catch (error) {
      console.error("아바타 URL 생성 실패:", error);
      return null;
    }
  };

  const renderAvatar = (record, fallback) => {
    const url = getAvatarUrl(record);
    if (url) {
      return <img src={url} alt={fallback} />;
    }
    return <div className="avatar-fallback">{fallback}</div>;
  };

  return (
    <div className="chat-shell">
      <header className="topbar">
        <div className="user-chip">
          <div className="avatar">
            {renderAvatar(
              currentUser,
              (displayName?.[0] || "U").toUpperCase(),
            )}
          </div>
          <div>
            <p className="eyebrow">현재 접속</p>
            <strong>{displayName}</strong>
          </div>
        </div>
        <button className="ghost-btn" onClick={onLogout}>
          나가기
        </button>
      </header>

      <div className="message-list" ref={listRef}>
        {isLoadingOlder && hasMore && (
          <div className="loading-older">이전 메시지 불러오는 중...</div>
        )}
        {messages.map((msg, index) => {
          const authorId =
            typeof msg.author === "string"
              ? msg.author
              : msg.author?.id || msg.expand?.author?.id;
          const isMe = authorId === currentUserId;
          const senderRecord = msg.expand?.author;
          const previousAuthor =
            typeof messages[index - 1]?.author === "string"
              ? messages[index - 1]?.author
              : messages[index - 1]?.author?.id ||
                messages[index - 1]?.expand?.author?.id;
          const showName = !isMe && (index === 0 || previousAuthor !== authorId);
          const fallbackInitial = (getSenderName(msg)[0] || "U").toUpperCase();

          return (
            <div
              key={msg.id}
              className={`message-row ${isMe ? "from-me" : "from-them"}`}
            >
              {!isMe && (
                <div className="message-avatar">
                  {renderAvatar(senderRecord, fallbackInitial)}
                </div>
              )}
              <div className="bubble-block">
                {showName && (
                  <span className="sender-label">{getSenderName(msg)}</span>
                )}
                <div className={`bubble ${isMe ? "mine" : "other"}`}>
                  {msg.text}
                </div>
              </div>
              {isMe && (
                <div className="message-avatar">
                  {renderAvatar(
                    senderRecord ?? currentUser,
                    (displayName[0] || "U").toUpperCase(),
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <form className="composer" onSubmit={sendMessage}>
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="새 메시지를 입력하세요..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          className="primary-btn accent-btn"
          type="submit"
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? "..." : "전송"}
        </button>
      </form>
    </div>
  );
}

export default App;
