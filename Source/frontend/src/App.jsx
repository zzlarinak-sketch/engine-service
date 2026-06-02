import { useEffect, useState } from 'react';
import RequestsPage from './RequestsPage';
import LogsPage from './LogsPage';
import AuthPage from './AuthPage';
import './App.css';

const API_URL = 'http://localhost:3000';

const emptyEngineForm = {
  model: '',
  engineType: 'бензиновый',
  powerHp: '',
  volumeLiters: '',
  serialNumber: '',
  status: 'на диагностике',
  clientId: '1',
};

function App() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const [activePage, setActivePage] = useState('dashboard');

  const [engines, setEngines] = useState([]);
  const [enginesLoading, setEnginesLoading] = useState(false);
  const [enginesError, setEnginesError] = useState('');

  const [showEngineForm, setShowEngineForm] = useState(false);
  const [engineForm, setEngineForm] = useState(emptyEngineForm);
  const [editingEngineId, setEditingEngineId] = useState(null);
  const [engineFormError, setEngineFormError] = useState('');
  const [engineFormSuccess, setEngineFormSuccess] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (token && activePage === 'engines') {
      loadEngines();
    }
  }, [token, activePage]);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка входа');
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      setToken(data.accessToken);
      setUser(data.user);
      setActivePage('dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken('');
    setUser(null);
    setUsername('admin');
    setPassword('admin123');
    setActivePage('dashboard');
  }

  async function loadEngines() {
    setEnginesLoading(true);
    setEnginesError('');

    try {
      const response = await fetch(`${API_URL}/engines`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось загрузить двигатели');
      }

      setEngines(data);
    } catch (err) {
      setEnginesError(err.message);
    } finally {
      setEnginesLoading(false);
    }
  }

  function handleEngineFormChange(event) {
    const { name, value } = event.target;

    setEngineForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function openCreateEngineForm() {
    setEditingEngineId(null);
    setEngineForm(emptyEngineForm);
    setEngineFormError('');
    setEngineFormSuccess('');
    setShowEngineForm(true);
  }

  function openEditEngineForm(engine) {
    setEditingEngineId(engine.id);
    setEngineForm({
      model: engine.model,
      engineType: engine.engineType,
      powerHp: String(engine.powerHp),
      volumeLiters: String(engine.volumeLiters),
      serialNumber: engine.serialNumber,
      status: engine.status,
      clientId: String(engine.clientId || '1'),
    });
    setEngineFormError('');
    setEngineFormSuccess('');
    setShowEngineForm(true);
  }

  function closeEngineForm() {
    setEditingEngineId(null);
    setEngineForm(emptyEngineForm);
    setShowEngineForm(false);
    setEngineFormError('');
  }

  async function handleSaveEngine(event) {
    event.preventDefault();

    setEngineFormError('');
    setEngineFormSuccess('');

    const isEditing = editingEngineId !== null;
    const url = isEditing
      ? `${API_URL}/engines/${editingEngineId}`
      : `${API_URL}/engines`;

    const method = isEditing ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: engineForm.model,
          engineType: engineForm.engineType,
          powerHp: Number(engineForm.powerHp),
          volumeLiters: Number(engineForm.volumeLiters),
          serialNumber: engineForm.serialNumber,
          status: engineForm.status,
          ...(isEditing ? {} : { clientId: Number(engineForm.clientId) }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;

        throw new Error(message || 'Не удалось сохранить двигатель');
      }

      setEngineFormSuccess(
        isEditing
          ? `Двигатель "${data.model}" успешно изменён`
          : `Двигатель "${data.model}" успешно добавлен`,
      );

      setEditingEngineId(null);
      setEngineForm(emptyEngineForm);
      setShowEngineForm(false);
      await loadEngines();
    } catch (err) {
      setEngineFormError(err.message);
    }
  }

  async function handleDeleteEngine(engine) {
    const confirmed = window.confirm(
      `Удалить двигатель "${engine.model}"? Это действие нельзя отменить.`,
    );

    if (!confirmed) {
      return;
    }

    setEnginesError('');
    setEngineFormSuccess('');

    try {
      const response = await fetch(`${API_URL}/engines/${engine.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось удалить двигатель');
      }

      setEngineFormSuccess(data.message);
      await loadEngines();
    } catch (err) {
      setEnginesError(err.message);
    }
  }

  if (!token || !user) {
    return (
      <AuthPage
        onLogin={(accessToken, loggedUser) => {
          setToken(accessToken);
          setUser(loggedUser);
          setActivePage('dashboard');
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Engine Service</h1>
          <p>Клиент-серверное приложение для учёта двигателей и сервисных заявок</p>
        </div>

        <div className="user-panel">
          <span>
            {user.username} · {user.role === 'admin' ? 'Администратор' : 'Клиент'}
          </span>
          <button type="button" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      <nav className="nav">
        <button
          type="button"
          className={activePage === 'dashboard' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActivePage('dashboard')}
        >
          Главная
        </button>

        <button
          type="button"
          className={activePage === 'engines' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActivePage('engines')}
        >
          Двигатели
        </button>

        <button
          type="button"
          className={activePage === 'requests' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActivePage('requests')}
        >
          Заявки
        </button>

        {user.role === 'admin' && (
          <button
            type="button"
            className={activePage === 'logs' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActivePage('logs')}
          >
            Логи
          </button>
        )}
      </nav>

      <main className="main">
        {activePage === 'dashboard' && (
          <>
            <section className="card hero-card">
              <h2>Панель управления</h2>
              <p>
                Вы успешно вошли в систему. Используйте меню, чтобы перейти к
                двигателям, заявкам и журналу действий.
              </p>
            </section>

            <section className="grid">
              <div className="card">
                <h3>Двигатели</h3>
                <p>Просмотр списка двигателей и информации о владельцах.</p>
              </div>

              <div className="card">
                <h3>Заявки</h3>
                <p>Создание и обработка заявок на обслуживание двигателей.</p>
              </div>

              <div className="card">
                <h3>Роль пользователя</h3>
                <p>
                  Текущая роль: <strong>{user.role}</strong>
                </p>
              </div>

              {user.role === 'admin' && (
                <div className="card">
                  <h3>Логи</h3>
                  <p>Журнал действий системы доступен только администратору.</p>
                </div>
              )}
            </section>
          </>
        )}

        {activePage === 'engines' && (
          <section className="card">
            <div className="section-header">
              <div>
                <h2>Двигатели</h2>
                <p>Список двигателей, полученный из базы данных PostgreSQL через API.</p>
              </div>

              <div className="button-row">
                {(user.role === 'admin' || user.role === 'client') && (
                  <button type="button" onClick={openCreateEngineForm}>
                    Добавить двигатель
                  </button>
                )}

                <button type="button" onClick={loadEngines}>
                  Обновить
                </button>
              </div>
            </div>

            {engineFormSuccess && <div className="success">{engineFormSuccess}</div>}

            {(user.role === 'admin' || user.role === 'client') && showEngineForm && (
              <form className="form-card" onSubmit={handleSaveEngine}>
                <h3>
                  {editingEngineId === null
                    ? 'Добавление двигателя'
                    : `Редактирование двигателя №${editingEngineId}`}
                </h3>

                <div className="form-grid">
                  <label>
                    Модель двигателя
                    <input
                      type="text"
                      name="model"
                      value={engineForm.model}
                      onChange={handleEngineFormChange}
                      placeholder="Например: Honda K20A"
                    />
                  </label>

                  <label>
                    Тип двигателя
                    <select
                      name="engineType"
                      value={engineForm.engineType}
                      onChange={handleEngineFormChange}
                    >
                      <option value="бензиновый">бензиновый</option>
                      <option value="дизельный">дизельный</option>
                      <option value="гибридный">гибридный</option>
                    </select>
                  </label>

                  <label>
                    Мощность, л.с.
                    <input
                      type="number"
                      name="powerHp"
                      value={engineForm.powerHp}
                      onChange={handleEngineFormChange}
                      placeholder="Например: 220"
                    />
                  </label>

                  <label>
                    Объём, л
                    <input
                      type="number"
                      step="0.01"
                      name="volumeLiters"
                      value={engineForm.volumeLiters}
                      onChange={handleEngineFormChange}
                      placeholder="Например: 2.00"
                    />
                  </label>

                  <label>
                    Серийный номер
                    <input
                      type="text"
                      name="serialNumber"
                      value={engineForm.serialNumber}
                      onChange={handleEngineFormChange}
                      placeholder="Например: ENG-HONDA-005"
                    />
                  </label>

                  {user.role === 'admin' && (
                    <label>
                      Статус
                      <select
                        name="status"
                        value={engineForm.status}
                        onChange={handleEngineFormChange}
                      >
                        <option value="на диагностике">на диагностике</option>
                        <option value="в ремонте">в ремонте</option>
                        <option value="исправен">исправен</option>
                        <option value="списан">списан</option>
                      </select>
                    </label>
                  )}

                  {user.role === 'admin' && editingEngineId === null && (
  <label>
    ID клиента
    <input
      type="number"
      name="clientId"
      value={engineForm.clientId}
      onChange={handleEngineFormChange}
      placeholder="Введите ID клиента"
    />
  </label>
)}
                </div>

                {engineFormError && <div className="error">{engineFormError}</div>}

                <div className="button-row">
                  <button type="submit">
                    {editingEngineId === null ? 'Сохранить' : 'Сохранить изменения'}
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeEngineForm}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}

            {enginesLoading && <div className="info">Загрузка данных...</div>}

            {enginesError && <div className="error">{enginesError}</div>}

            {!enginesLoading && !enginesError && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Модель</th>
                      <th>Тип</th>
                      <th>Мощность</th>
                      <th>Объём</th>
                      <th>Серийный номер</th>
                      <th>Статус</th>
                      <th>Клиент</th>
                      {user.role === 'admin' && <th>Действия</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {engines.map((engine) => (
                      <tr key={engine.id}>
                        <td>{engine.id}</td>
                        <td>{engine.model}</td>
                        <td>{engine.engineType}</td>
                        <td>{engine.powerHp} л.с.</td>
                        <td>{engine.volumeLiters} л</td>
                        <td>{engine.serialNumber}</td>
                        <td>
                          <span className="badge">{engine.status}</span>
                        </td>
                        <td>{engine.clientName}</td>

                        {user.role === 'admin' && (
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="small-button"
                                onClick={() => openEditEngineForm(engine)}
                              >
                                Изменить
                              </button>

                              <button
                                type="button"
                                className="small-button danger-button"
                                onClick={() => handleDeleteEngine(engine)}
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activePage === 'requests' && (
          <RequestsPage token={token} user={user} />
        )}

        {activePage === 'logs' && user.role === 'admin' && (
          <LogsPage token={token} />
        )}
      </main>
    </div>
  );
}

export default App;
