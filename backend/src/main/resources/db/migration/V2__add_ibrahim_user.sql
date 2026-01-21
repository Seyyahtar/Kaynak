INSERT INTO users (id, username, password_hash, full_name, email)
VALUES (
    gen_random_uuid(),
    'ibrahim',
    '$2a$10$N.zmdr9k7uOCQb376NoUnutj8iAt6ValmpBkSQL/aURtEdpYnAFge', -- Hash for "123"
    'İbrahim',
    'ibrahim@stok.app'
);
