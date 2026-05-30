-- Курсовая работа, вариант 12 "Двигатель"
-- База данных для клиент-серверного приложения "Engine Service"

DROP TABLE IF EXISTS action_logs CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS engines CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP VIEW IF EXISTS view_engines_with_clients;
DROP VIEW IF EXISTS view_active_requests;
DROP VIEW IF EXISTS view_service_statistics;

DROP FUNCTION IF EXISTS get_client_engines_count(integer);
DROP FUNCTION IF EXISTS get_active_requests_count();
DROP FUNCTION IF EXISTS get_client_total_service_cost(integer);

DROP PROCEDURE IF EXISTS create_service_request(integer, text, numeric);
DROP PROCEDURE IF EXISTS complete_service_request(integer);
DROP PROCEDURE IF EXISTS change_engine_status(integer, text);

DROP FUNCTION IF EXISTS log_engine_insert();
DROP FUNCTION IF EXISTS log_service_request_update();
DROP FUNCTION IF EXISTS prevent_engine_delete_with_active_request();
DROP FUNCTION IF EXISTS sync_engine_status_after_request_update();
DROP FUNCTION IF EXISTS sync_request_status_after_engine_update();

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    client_id INTEGER REFERENCES clients(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE engines (
    id SERIAL PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    engine_type VARCHAR(50) NOT NULL,
    power_hp INTEGER NOT NULL CHECK (power_hp > 0),
    volume_liters NUMERIC(4, 2) NOT NULL CHECK (volume_liters > 0),
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'на диагностике',
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_requests (
    id SERIAL PRIMARY KEY,
    engine_id INTEGER NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'новая',
    price NUMERIC(10, 2) DEFAULT 0 CHECK (price >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE action_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES
('admin', 'Администратор системы'),
('client', 'Клиент сервисного центра');

INSERT INTO clients (name, email, phone) VALUES
('Иван Петров', 'ivan.petrov@example.com', '+7 900 111-22-33'),
('Анна Смирнова', 'anna.smirnova@example.com', '+7 900 222-33-44'),
('ООО АвтоПарк', 'office@autopark.example.com', '+7 900 333-44-55');

INSERT INTO app_users (username, email, password_hash, role_id, client_id) VALUES
('admin', 'admin@example.com', 'demo_admin_hash', 1, NULL),
('client1', 'ivan.petrov@example.com', 'demo_client_hash', 2, 1);

INSERT INTO engines (model, engine_type, power_hp, volume_liters, serial_number, status, client_id) VALUES
('Toyota 2JZ-GE', 'бензиновый', 220, 3.00, 'ENG-2JZ-001', 'на диагностике', 1),
('BMW N52B30', 'бензиновый', 258, 3.00, 'ENG-N52-002', 'в ремонте', 2),
('Cummins ISF 2.8', 'дизельный', 150, 2.80, 'ENG-CUM-003', 'исправен', 3);

INSERT INTO service_requests (engine_id, description, status, price) VALUES
(1, 'Проверка компрессии двигателя', 'новая', 2500),
(2, 'Посторонний шум при запуске', 'в работе', 5000),
(3, 'Плановое техническое обслуживание', 'завершена', 8000);

CREATE VIEW view_engines_with_clients AS
SELECT
    e.id,
    e.model,
    e.engine_type,
    e.power_hp,
    e.volume_liters,
    e.serial_number,
    e.status,
    e.client_id,
    c.name AS client_name,
    c.email AS client_email
FROM engines e
JOIN clients c ON c.id = e.client_id;

CREATE VIEW view_active_requests AS
SELECT
    sr.id,
    e.model AS engine_model,
    c.name AS client_name,
    sr.description,
    sr.status,
    sr.price,
    sr.created_at
FROM service_requests sr
JOIN engines e ON e.id = sr.engine_id
JOIN clients c ON c.id = e.client_id
WHERE sr.status IN ('новая', 'в работе');

CREATE VIEW view_service_statistics AS
SELECT
    sr.status,
    COUNT(*) AS requests_count,
    COALESCE(SUM(sr.price), 0) AS total_price
FROM service_requests sr
GROUP BY sr.status;

CREATE FUNCTION get_client_engines_count(client_id_param INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO result_count
    FROM engines
    WHERE client_id = client_id_param;

    RETURN result_count;
END;
$$;

CREATE FUNCTION get_active_requests_count()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO result_count
    FROM service_requests
    WHERE status IN ('новая', 'в работе');

    RETURN result_count;
END;
$$;

CREATE FUNCTION get_client_total_service_cost(client_id_param INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    total_cost NUMERIC;
BEGIN
    SELECT COALESCE(SUM(sr.price), 0)
    INTO total_cost
    FROM service_requests sr
    JOIN engines e ON e.id = sr.engine_id
    WHERE e.client_id = client_id_param;

    RETURN total_cost;
END;
$$;

CREATE PROCEDURE create_service_request(
    engine_id_param INTEGER,
    description_param TEXT,
    price_param NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO service_requests (engine_id, description, status, price)
    VALUES (engine_id_param, description_param, 'новая', price_param);
END;
$$;

CREATE PROCEDURE complete_service_request(request_id_param INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE service_requests
    SET status = 'завершена',
        completed_at = CURRENT_TIMESTAMP
    WHERE id = request_id_param;
END;
$$;

CREATE PROCEDURE change_engine_status(
    engine_id_param INTEGER,
    new_status_param TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE engines
    SET status = new_status_param
    WHERE id = engine_id_param;
END;
$$;

CREATE FUNCTION log_engine_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO action_logs (action, entity_name, entity_id, description)
    VALUES (
        'CREATE',
        'engines',
        NEW.id,
        'Добавлен двигатель: ' || NEW.model
    );

    RETURN NEW;
END;
$$;

CREATE FUNCTION log_service_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO action_logs (action, entity_name, entity_id, description)
    VALUES (
        'UPDATE',
        'service_requests',
        NEW.id,
        'Изменён статус заявки с "' || OLD.status || '" на "' || NEW.status || '"'
    );

    RETURN NEW;
END;
$$;

CREATE FUNCTION prevent_engine_delete_with_active_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM service_requests
        WHERE engine_id = OLD.id
          AND status IN ('новая', 'в работе')
    ) THEN
        RAISE EXCEPTION 'Нельзя удалить двигатель, пока по нему есть активная заявка';
    END IF;

    RETURN OLD;
END;
$$;



CREATE FUNCTION sync_engine_status_after_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'новая' THEN
        UPDATE engines
        SET status = 'на диагностике'
        WHERE id = NEW.engine_id;
    ELSIF NEW.status = 'в работе' THEN
        UPDATE engines
        SET status = 'в ремонте'
        WHERE id = NEW.engine_id;
    ELSIF NEW.status = 'завершена' THEN
        UPDATE engines
        SET status = 'исправен'
        WHERE id = NEW.engine_id;
    ELSIF NEW.status = 'отменена' THEN
        UPDATE engines
        SET status = 'на диагностике'
        WHERE id = NEW.engine_id;
    END IF;

    RETURN NEW;
END;
$$;



CREATE FUNCTION sync_request_status_after_engine_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_request_id INTEGER;
    new_request_status TEXT;
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'на диагностике' THEN
        new_request_status := 'новая';
    ELSIF NEW.status = 'в ремонте' THEN
        new_request_status := 'в работе';
    ELSIF NEW.status = 'исправен' THEN
        new_request_status := 'завершена';
    ELSIF NEW.status = 'списан' THEN
        new_request_status := 'отменена';
    ELSE
        RETURN NEW;
    END IF;

    SELECT id
    INTO target_request_id
    FROM service_requests
    WHERE engine_id = NEW.id
      AND status IN ('новая', 'в работе')
    ORDER BY id DESC
    LIMIT 1;

    IF target_request_id IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE service_requests
    SET status = new_request_status,
        completed_at = CASE
            WHEN new_request_status = 'завершена' THEN CURRENT_TIMESTAMP
            ELSE completed_at
        END
    WHERE id = target_request_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_engine_insert
AFTER INSERT ON engines
FOR EACH ROW
EXECUTE FUNCTION log_engine_insert();

CREATE TRIGGER trigger_log_service_request_update
AFTER UPDATE ON service_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_service_request_update();

CREATE TRIGGER trigger_prevent_engine_delete_with_active_request
BEFORE DELETE ON engines
FOR EACH ROW
EXECUTE FUNCTION prevent_engine_delete_with_active_request();


CREATE TRIGGER trigger_sync_engine_status_after_request_update
AFTER UPDATE OF status ON service_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_engine_status_after_request_update();


CREATE TRIGGER trigger_sync_request_status_after_engine_update
AFTER UPDATE OF status ON engines
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_request_status_after_engine_update();
