import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000';

function LogsPage({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось загрузить логи');
      }

      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h2>Логи</h2>
          <p>Журнал действий системы. Этот раздел доступен только администратору.</p>
        </div>

        <button type="button" onClick={loadLogs}>
          Обновить
        </button>
      </div>

      {loading && <div className="info">Загрузка данных...</div>}

      {error && <div className="error">{error}</div>}

      {!loading && !error && logs.length === 0 && (
        <div className="info">Журнал действий пока пуст.</div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Действие</th>
                <th>Сущность</th>
                <th>ID записи</th>
                <th>Описание</th>
                <th>Дата и время</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>
                    <span className="badge">{log.action}</span>
                  </td>
                  <td>{log.entityName}</td>
                  <td>{log.entityId}</td>
                  <td>{log.description}</td>
                  <td>{new Date(log.createdAt).toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default LogsPage;
