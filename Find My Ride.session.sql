SELECT *
FROM information_schema.tables
WHERE table_name = 'drivers';


SELECT
column_name
FROM information_schema.columns
WHERE table_name='drivers';

SELECT datname
FROM pg_database;

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'students';

SELECT *
FROM students;