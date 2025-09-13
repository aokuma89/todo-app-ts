import React, { useState, useEffect, useRef } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = 'all' | 'todo' | 'done';

function Todo() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isInit, setIsInit] = useState<boolean>(false);

  const editInputRef = useRef<HTMLInputElement | null>(null);
    
  useEffect(() => {
    const saved = localStorage.getItem('todos');
    if (saved !== null) {
      const parsed: Todo[] = JSON.parse(saved);
      setTodos(parsed);
    }
    setIsInit(true);
  }, []);

  useEffect(() => {
    if (isInit === true) {
      const json = JSON.stringify(todos);
      localStorage.setItem('todos', json);
    }
  }, [todos, isInit]);

  useEffect(() => {
    if (editingId !== null) {
      const fn = (event: MouseEvent) => {
        if (editInputRef.current) {
          if (!editInputRef.current.contains(event.target as Node)) {
            saveEdit();
          }
        }
      };
      document.addEventListener('mousedown', fn);
      return () => {
        document.removeEventListener('mousedown', fn);
      };
    }
  }, [editingId, editValue, todos]);

  const addTodo = () => {
    const trimmedInputValue = inputValue.trim();
    if (trimmedInputValue === '') {
      return;
    }

    const isDuplicate = todos.some(
      (todo) => todo.text.toLowerCase() === trimmedInputValue.toLowerCase()
    );

    if (isDuplicate) {
      alert('同じ名前のタスクが既に存在します。');
      return;
    }

    const now = new Date();
    const newId = now.getTime();

    const newTodo: Todo = {
      id: newId,
      text: trimmedInputValue,
      completed: false,
    };

    const copied = [...todos];
    copied.push(newTodo);

    setTodos(copied);
    setInputValue('');
  };

  const toggleTodo = (id: number) => {
    const updated = todos.map((todo) => {
      if (todo.id === id) {
        const changed: Todo = {
          ...todo,
          completed: !todo.completed,
        };
        return changed;
      } else {
        return todo;
      }
    });
    setTodos(updated);
  };

  const deleteTodo = (id: number) => {
    const filtered = todos.filter((t) => {
      return t.id !== id;
    });
    setTodos(filtered);
  };

  const deleteCompletedTodos = () => {
    const filtered = todos.filter((t) => t.completed === false);
    setTodos(filtered);
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditValue(todo.text);
  };

  const saveEdit = () => {
    const trimmedEditValue = editValue.trim();
    if (trimmedEditValue === '') {
      return;
    }
    if (editingId === null) {
      return;
    }

    // 編集後のテキストが既存の他のタスクと重複しないかチェック
    const isDuplicate = todos.some(
      (todo) => todo.id !== editingId && todo.text.toLowerCase() === trimmedEditValue.toLowerCase()
    );

    if (isDuplicate) {
      alert('同じ名前のタスクが既に存在します。'); // ユーザーに重複を通知
      return;
    }

    const updated = todos.map((todo) => {
      if (todo.id === editingId) {
        const newTodo: Todo = { ...todo, text: trimmedEditValue };
        return newTodo;
      }
      return todo;
    });
    setTodos(updated);
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      addTodo();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const completedCount = todos.filter((t) => t.completed === true).length;
  const hasCompleted = completedCount > 0;

  let filteredTodos: Todo[] = [];
  if (filter === 'all') {
    filteredTodos = todos;
  } else if (filter === 'todo') {
    filteredTodos = todos.filter((t) => t.completed === false);
  } else if (filter === 'done') {
    filteredTodos = todos.filter((t) => t.completed === true);
  }

  return (
    <div className="todo-container">
      <h1>Todo App</h1>

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

      <div className="filter-tabs">
        <button
          onClick={() => setFilter('all')}
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
        >
          すべて ({todos.length})
        </button>
        <button
          onClick={() => setFilter('todo')}
          className={`filter-tab ${filter === 'todo' ? 'active' : ''}`}
        >
          未完了 ({todos.filter((t) => t.completed === false).length})
        </button>
        <button
          onClick={() => setFilter('done')}
          className={`filter-tab ${filter === 'done' ? 'active' : ''}`}
        >
          完了済み ({completedCount})
        </button>
      </div>

      <div className="todo-list">
        {filteredTodos.length === 0 ? (
          <p className="empty-message">
            {filter === 'all' && 'タスクがありません。新しいタスクを追加してください。'}
            {filter === 'todo' && '未完了のタスクがありません。'}
            {filter === 'done' && '完了したタスクがありません。'}
          </p>
        ) : (
          filteredTodos.map((todo) => {
            return (
              <div
                key={todo.id}
                className={`todo-item ${todo.completed ? 'completed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="todo-checkbox"
                />
                {editingId === todo.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                    className="edit-input"
                  />
                ) : (
                  <span
                    className="todo-text clickable"
                    onClick={() => startEditing(todo)}
                  >
                    {todo.text}
                  </span>
                )}
                <div className="todo-actions">
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="delete-button"
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {todos.length > 0 && (
        <div className="todo-stats">
          <div className="stats-content">
            <div className="stats-header">
              <span className="stats-text">
                完了: {completedCount} / {todos.length}
              </span>
              {hasCompleted && (
                <button
                  onClick={deleteCompletedTodos}
                  className="clear-completed-button"
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
                      ? String((completedCount / todos.length) * 100) + '%'
                      : '0%',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Todo;
