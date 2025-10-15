import React, { useState, useEffect, useRef } from "react";
import "../App.css";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = "all" | "todo" | "done";

function Todo() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [isInit, setIsInit] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [collapsedCompleted, setCollapsedCompleted] = useState<boolean>(false);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);
  const searchModalRef = useRef<HTMLDivElement | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("todos");
    if (saved !== null) {
      const parsed: Todo[] = JSON.parse(saved);
      setTodos(parsed);
    }
    setIsInit(true);
  }, []);

  useEffect(() => {
    if (isInit) {
      localStorage.setItem("todos", JSON.stringify(todos));
    }
  }, [todos, isInit]);

  useEffect(() => {
    if (editingId !== null) {
      const fn = (event: MouseEvent) => {
        if (
          editInputRef.current &&
          !editInputRef.current.contains(event.target as Node)
        ) {
          saveEdit();
        }
      };
      document.addEventListener("mousedown", fn);
      return () => {
        document.removeEventListener("mousedown", fn);
      };
    }
  }, [editingId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchModalRef.current &&
        !searchModalRef.current.contains(event.target as Node) &&
        searchButtonRef.current &&
        !searchButtonRef.current.contains(event.target as Node)
      ) {
        setShowSearchModal(false);
        setSearchValue("");
      }
    };
    if (showSearchModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchModal]);

  const addTodo = () => {
    const trimmedInputValue = inputValue.trim();
    if (trimmedInputValue === "") return;

    const isDuplicate = todos.some(
      (todo) => todo.text.toLowerCase() === trimmedInputValue.toLowerCase()
    );
    if (isDuplicate) {
      alert("同じ名前のタスクが既に存在します。");
      return;
    }

    const newTodo: Todo = {
      id: Date.now(),
      text: trimmedInputValue,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setInputValue("");
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  const deleteCompletedTodos = () => {
    setTodos(todos.filter((t) => !t.completed));
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditValue(todo.text);
  };

  const saveEdit = () => {
    const trimmedEditValue = editValue.trim();
    if (!trimmedEditValue || editingId === null) return;

    const isDuplicate = todos.some(
      (todo) =>
        todo.id !== editingId &&
        todo.text.toLowerCase() === trimmedEditValue.toLowerCase()
    );
    if (isDuplicate) {
      alert("同じ名前のタスクが既に存在します。");
      return;
    }

    setTodos(
      todos.map((todo) =>
        todo.id === editingId ? { ...todo, text: trimmedEditValue } : todo
      )
    );
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) addTodo();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const hasCompleted = completedCount > 0;

  let filteredTodos: Todo[] = [];
  if (filter === "all") {
    filteredTodos = todos;
    // 完了済みTodoを折りたたむ機能（モバイルでかつ「すべて」表示時のみ）
    if (isMobile && collapsedCompleted) {
      const pendingTodos = todos.filter((t) => !t.completed);
      const completedTodos = todos.filter((t) => t.completed);
      filteredTodos = pendingTodos.length > 0 ? pendingTodos : completedTodos;
    }
  }
  if (filter === "todo") filteredTodos = todos.filter((t) => !t.completed);
  if (filter === "done") filteredTodos = todos.filter((t) => t.completed);

  const searchedTodos = filteredTodos.filter((t) =>
    t.text.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getFilterDisplayWithCount = (filterType: FilterType) => {
    switch (filterType) {
      case "all":
        return `すべて (${todos.length})`;
      case "todo":
        return `未完了 (${todos.filter((t) => !t.completed).length})`;
      case "done":
        return `完了済み (${completedCount})`;
      default:
        return "";
    }
  };

  const renderTodoList = (todoList: Todo[]) => {
    return todoList.length === 0 ? (
      <div className="empty-message">タスクがありません</div>
    ) : (
      todoList.map((todo) =>
        editingId === todo.id ? (
          <div key={todo.id} className="todo-item editing">
            <div className="edit-container" ref={editInputRef}>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="edit-input"
                autoFocus
              />
              <div className="edit-buttons">
                <button className="save-button" onClick={saveEdit}>
                  保存
                </button>
                <button className="cancel-button" onClick={cancelEdit}>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            key={todo.id}
            className={`todo-item ${todo.completed ? "completed" : ""}`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="todo-checkbox"
            />
            <div
              className="todo-text clickable"
              onClick={() => startEditing(todo)}
            >
              {todo.text}
            </div>
            <div className="todo-actions">
              <button
                className="delete-button"
                onClick={() => deleteTodo(todo.id)}
              >
                削除
              </button>
            </div>
          </div>
        )
      )
    );
  };

  const renderSearchTodoList = (todoList: Todo[]) => {
    return todoList.length === 0 ? (
      <div className="empty-message">一致するタスクがありません</div>
    ) : (
      todoList.map((todo) =>
        editingId === todo.id ? (
          <div key={todo.id} className="todo-item editing">
            <div className="edit-container" ref={editInputRef}>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="edit-input"
                autoFocus
              />
              <div className="edit-buttons">
                <button className="save-button" onClick={saveEdit}>
                  保存
                </button>
                <button className="cancel-button" onClick={cancelEdit}>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            key={todo.id}
            className={`todo-item ${todo.completed ? "completed" : ""}`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="todo-checkbox"
            />
            <div
              className="todo-text clickable"
              onClick={() => startEditing(todo)}
            >
              {todo.text}
            </div>
            <div className="todo-actions">
              <button
                className="delete-button"
                onClick={() => deleteTodo(todo.id)}
              >
                削除
              </button>
            </div>
          </div>
        )
      )
    );
  };

  return (
    <div className="todo-container">
      <header className="header">
        <h1>Todo App</h1>
        <button
          className="search-icon-button"
          onClick={() => setShowSearchModal((prev) => !prev)}
          ref={searchButtonRef}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" />
          </svg>
        </button>
      </header>

      <div className="todo-input">
        <input
          type="text"
          value={inputValue}
          placeholder="新しいタスクを入力してください..."
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="todo-input-field"
        />
        <button onClick={addTodo} className="add-button">
          追加
        </button>
      </div>

      <div
        className={`filter-tabs ${isMobile ? "filter-tabs-mobile" : ""}`}
        ref={isMobile ? filterDropdownRef : null}
      >
        {isMobile ? (
          <>
            <button
              className={`filter-dropdown-toggle filter-tab filter-dropdown-toggle-style`}
              onClick={() => setShowFilterDropdown((prev) => !prev)}
            >
              <span>{getFilterDisplayWithCount(filter)}</span>
              <span
                className={`filter-dropdown-arrow ${
                  showFilterDropdown ? "open" : ""
                }`}
              >
                {showFilterDropdown ? "▲" : "▼"}
              </span>
            </button>
            <div
              className={`filter-dropdown-options ${
                showFilterDropdown ? "open" : ""
              }`}
            >
              <button
                onClick={() => {
                  setFilter("all");
                  setShowFilterDropdown(false);
                }}
                className={`filter-dropdown-option filter-tab ${
                  filter === "all" ? "active" : ""
                } filter-dropdown-option-style`}
              >
                すべて ({todos.length})
              </button>
              <button
                onClick={() => {
                  setFilter("todo");
                  setShowFilterDropdown(false);
                }}
                className={`filter-dropdown-option filter-tab ${
                  filter === "todo" ? "active" : ""
                } filter-dropdown-option-style`}
              >
                未完了 ({todos.filter((t) => !t.completed).length})
              </button>
              <button
                onClick={() => {
                  setFilter("done");
                  setShowFilterDropdown(false);
                }}
                className={`filter-dropdown-option filter-tab ${
                  filter === "done" ? "active" : ""
                } filter-dropdown-option-style`}
              >
                完了済み ({completedCount})
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setFilter("all")}
              className={`filter-tab ${filter === "all" ? "active" : ""}`}
            >
              すべて ({todos.length})
            </button>
            <button
              onClick={() => setFilter("todo")}
              className={`filter-tab ${filter === "todo" ? "active" : ""}`}
            >
              未完了 ({todos.filter((t) => !t.completed).length})
            </button>
            <button
              onClick={() => setFilter("done")}
              className={`filter-tab ${filter === "done" ? "active" : ""}`}
            >
              完了済み ({completedCount})
            </button>
          </>
        )}
      </div>

      <div className="todo-list">{renderTodoList(filteredTodos)}</div>

      {/* モバイル用折りたたみボタン */}
      {isMobile && filter === "all" && hasCompleted && (
        <div className="collapse-toggle-container">
          <button
            className="collapse-toggle-button"
            onClick={() => setCollapsedCompleted(!collapsedCompleted)}
          >
            {collapsedCompleted ? "完了済みを表示" : "完了済みを隠す"}
            <span
              className={`collapse-arrow ${
                collapsedCompleted ? "collapsed" : ""
              }`}
            >
              ▼
            </span>
          </button>
        </div>
      )}

      <div className="todo-stats">
        <div className="stats-content">
          <div className="stats-header">
            <div className="stats-text">
              {completedCount} / {todos.length} タスク完了
            </div>
            {hasCompleted && (
              <button
                className="clear-completed-button"
                onClick={deleteCompletedTodos}
              >
                完了済みを削除
              </button>
            )}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width:
                  todos.length > 0
                    ? `${(completedCount / todos.length) * 100}%`
                    : "0%",
              }}
            ></div>
          </div>
        </div>
      </div>

      {showSearchModal && (
        <div className="search-modal" ref={searchModalRef}>
          <input
            type="text"
            value={searchValue}
            placeholder="検索ワードを入力..."
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
            autoFocus
          />
          <div className="todo-list">
            {searchValue.trim() === "" ? (
              <div className="empty-message">検索してください</div>
            ) : (
              renderSearchTodoList(searchedTodos)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Todo;
