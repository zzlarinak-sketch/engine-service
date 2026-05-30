import { useState } from 'react';

const API_URL = 'http://localhost:3000';

const emptyRegisterForm = {
  name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
};

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');

  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');

  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleRegisterChange(event) {
    const { name, value } = event.target;

    setRegisterForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleLogin(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка входа');
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLogin(data.accessToken, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerForm),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;

        throw new Error(message || 'Ошибка регистрации');
      }

      setSuccess(data.message);
      setLoginUsername(registerForm.username);
      setLoginPassword('');
      setRegisterForm(emptyRegisterForm);
      setMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'register') {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleRegister}>
          <h1>Регистрация</h1>
          <p className="subtitle">Создание аккаунта клиента</p>

          <label>
            Имя
            <input
              type="text"
              name="name"
              value={registerForm.name}
              onChange={handleRegisterChange}
              placeholder="Введите имя"
            />
          </label>

          <label>
            Логин
            <input
              type="text"
              name="username"
              value={registerForm.username}
              onChange={handleRegisterChange}
              placeholder="Придумайте логин"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              placeholder="Введите email"
            />
          </label>

          <label>
            Телефон
            <input
              type="text"
              name="phone"
              value={registerForm.phone}
              onChange={handleRegisterChange}
              placeholder="Введите телефон"
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              name="password"
              value={registerForm.password}
              onChange={handleRegisterChange}
              placeholder="Минимум 6 символов"
            />
          </label>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          <div className="auth-switch">
            Уже есть аккаунт?{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
            >
              Войти
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>Engine Service</h1>
        <p className="subtitle">Вход в систему учёта двигателей</p>

        <label>
          Логин
          <input
            type="text"
            value={loginUsername}
            onChange={(event) => setLoginUsername(event.target.value)}
            placeholder="Введите логин"
          />
        </label>

        <label>
          Пароль
          <input
            type="password"
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            placeholder="Введите пароль"
          />
        </label>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>

        <div className="auth-switch">
          Нет аккаунта?{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setMode('register');
              setError('');
              setSuccess('');
            }}
          >
            Зарегистрироваться
          </button>
        </div>
      </form>
    </div>
  );
}

export default AuthPage;
