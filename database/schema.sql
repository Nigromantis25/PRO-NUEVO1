-- Tabla para los usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(100) NOT NULL,
    rol VARCHAR(50) NOT NULL
);

-- Tabla para los productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    imagen_url TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL
);

-- Tabla para el carrito
CREATE TABLE carrito (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL
);

-- Tabla para las órdenes
CREATE TABLE ordenes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    total DECIMAL(10, 2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para los detalles de las órdenes
CREATE TABLE orden_detalles (
    id SERIAL PRIMARY KEY,
    orden_id INT REFERENCES ordenes(id),
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL
);