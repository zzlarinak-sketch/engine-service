import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000';

const emptyRequestForm = {
  engineId: '',
  description: '',
  status: 'новая',
  price: '',
};

function RequestsPage({ token, user }) {
  const [requests, setRequests] = useState([]);
  const [engines, setEngines] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRequests();
    loadEngines();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/service-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось загрузить заявки');
      }

      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadEngines() {
    try {
      const response = await fetch(`${API_URL}/engines`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setEngines(data);

        if (data.length > 0) {
          setRequestForm((currentForm) => ({
            ...currentForm,
            engineId: String(data[0].id),
          }));
        }
      }
    } catch {
      setEngines([]);
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setRequestForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function openCreateForm() {
    setEditingRequestId(null);
    setRequestForm({
      ...emptyRequestForm,
      engineId: engines.length > 0 ? String(engines[0].id) : '',
    });
    setFormError('');
    setSuccess('');
    setShowForm(true);
  }

  function openEditForm(request) {
    setEditingRequestId(request.id);
    setRequestForm({
      engineId: String(request.engineId),
      description: request.description,
      status: request.status,
      price: String(request.price),
    });
    setFormError('');
    setSuccess('');
    setShowForm(true);
  }

  function closeForm() {
    setEditingRequestId(null);
    setRequestForm(emptyRequestForm);
    setFormError('');
    setShowForm(false);
  }

  async function handleSaveRequest(event) {
    event.preventDefault();

    setFormError('');
    setSuccess('');

    if (!editingRequestId && !requestForm.engineId) {
      setFormError('Сначала добавьте двигатель в разделе «Двигатели»');
      return;
    }

    const isEditing = editingRequestId !== null;
    const url = isEditing
      ? `${API_URL}/service-requests/${editingRequestId}`
      : `${API_URL}/service-requests`;

    const method = isEditing ? 'PATCH' : 'POST';

    const body = isEditing
      ? {
          description: requestForm.description,
          status: requestForm.status,
          price: Number(requestForm.price),
        }
      : {
          engineId: Number(requestForm.engineId),
          description: requestForm.description,
        };

    if (!isEditing && user.role === 'admin' && requestForm.price !== '') {
      body.price = Number(requestForm.price);
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;

        throw new Error(message || 'Не удалось сохранить заявку');
      }

      setSuccess(
        isEditing
          ? `Заявка №${data.id} успешно изменена`
          : `Заявка №${data.id} успешно создана`,
      );

      setEditingRequestId(null);
      setRequestForm(emptyRequestForm);
      setShowForm(false);

      await loadRequests();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDeleteRequest(request) {
    const confirmed = window.confirm(
      `Удалить заявку №${request.id}? Это действие нельзя отменить.`,
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/service-requests/${request.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось удалить заявку');
      }

      setSuccess(data.message);
      await loadRequests();
    } catch (err) {
      setError(err.message);
    }
  }

  const clientHasNoEngines = user.role === 'client' && engines.length === 0;

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h2>Заявки</h2>
          <p>Список заявок на обслуживание двигателей, полученный через API.</p>
        </div>

        <div className="button-row">
          <button
            type="button"
            onClick={openCreateForm}
            disabled={clientHasNoEngines}
          >
            Создать заявку
          </button>

          <button type="button" onClick={loadRequests}>
            Обновить
          </button>
        </div>
      </div>

      {clientHasNoEngines && (
        <div className="info">
          У вас пока нет добавленных двигателей. Сначала перейдите в раздел
          «Двигатели» и добавьте свой двигатель, после этого можно будет создать
          заявку на обслуживание.
        </div>
      )}

      {success && <div className="success">{success}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSaveRequest}>
          <h3>
            {editingRequestId === null
              ? 'Создание заявки'
              : `Редактирование заявки №${editingRequestId}`}
          </h3>

          <div className="form-grid">
            {editingRequestId === null && (
              <label>
                Двигатель
                <select
                  name="engineId"
                  value={requestForm.engineId}
                  onChange={handleFormChange}
                >
                  {engines.map((engine) => (
                    <option key={engine.id} value={engine.id}>
                      {engine.id} — {engine.model}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Описание проблемы
              <input
                type="text"
                name="description"
                value={requestForm.description}
                onChange={handleFormChange}
                placeholder="Например: посторонний шум при запуске"
              />
            </label>

            {editingRequestId !== null && (
              <label>
                Статус
                <select
                  name="status"
                  value={requestForm.status}
                  onChange={handleFormChange}
                >
                  <option value="новая">новая</option>
                  <option value="в работе">в работе</option>
                  <option value="завершена">завершена</option>
                  <option value="отменена">отменена</option>
                </select>
              </label>
            )}

            {(editingRequestId !== null || user.role === 'admin') && (
              <label>
                Стоимость, руб.
                <input
                  type="number"
                  name="price"
                  value={requestForm.price}
                  onChange={handleFormChange}
                  placeholder="Например: 3000"
                />
              </label>
            )}
          </div>

          {formError && <div className="error">{formError}</div>}

          <div className="button-row">
            <button type="submit">
              {editingRequestId === null ? 'Сохранить' : 'Сохранить изменения'}
            </button>

            <button type="button" className="secondary-button" onClick={closeForm}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {loading && <div className="info">Загрузка данных...</div>}

      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Двигатель</th>
                <th>Клиент</th>
                <th>Описание</th>
                <th>Статус</th>
                <th>Стоимость</th>
                <th>Дата создания</th>
                {user.role === 'admin' && <th>Действия</th>}
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.engineModel}</td>
                  <td>{request.clientName}</td>
                  <td>{request.description}</td>
                  <td>
                    <span className="badge">{request.status}</span>
                  </td>
                  <td>{Number(request.price) > 0 ? `${request.price} руб.` : 'не назначена'}</td>
                  <td>{new Date(request.createdAt).toLocaleString('ru-RU')}</td>

                  {user.role === 'admin' && (
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="small-button"
                          onClick={() => openEditForm(request)}
                        >
                          Изменить
                        </button>

                        <button
                          type="button"
                          className="small-button danger-button"
                          onClick={() => handleDeleteRequest(request)}
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
  );
}

export default RequestsPage;
