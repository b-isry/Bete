process.env.PORT = '4000';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://bete_user:changeme@localhost:5432/bete_db';
process.env.JWT_SECRET = 'test_jwt_secret_must_be_at_least_32_chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:3000';
