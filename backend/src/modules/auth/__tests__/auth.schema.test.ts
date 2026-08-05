import {
  LoginSchema,
  RegisterSchema,
  RequestOtpSchema,
  SubmitVerificationSchema,
  VerifyOtpSchema,
} from '../schemas/auth.schema';

describe('RegisterSchema', () => {
  const valid = {
    name: 'Abebe Kebede',
    phone: '0912345678',
    password: 'Password1',
  };

  it('accepts a valid USER registration payload', () => {
    const result = RegisterSchema.parse(valid);
    expect(result.role).toBe('USER');
    expect(result.phone).toBe('0912345678');
  });

  it('accepts SELLER role and +251 phone format', () => {
    const result = RegisterSchema.parse({
      ...valid,
      phone: '+251912345678',
      role: 'SELLER',
      email: 'abebe@example.com',
      primary_city_id: 1,
      bio: 'Residential specialist in Bole.',
    });
    expect(result.role).toBe('SELLER');
    expect(result.email).toBe('abebe@example.com');
    expect(result.primary_city_id).toBe(1);
    expect(result.bio).toBe('Residential specialist in Bole.');
  });

  it('rejects seller-only fields on USER registration', () => {
    expect(
      RegisterSchema.safeParse({
        ...valid,
        role: 'USER',
        primary_city_id: 1,
      }).success,
    ).toBe(false);
    expect(
      RegisterSchema.safeParse({
        ...valid,
        role: 'USER',
        bio: 'Should not be allowed',
      }).success,
    ).toBe(false);
  });

  it('rejects ADMIN role on public registration', () => {
    const result = RegisterSchema.safeParse({ ...valid, role: 'ADMIN' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid Ethiopian phone numbers', () => {
    const result = RegisterSchema.safeParse({ ...valid, phone: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects weak passwords', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: 'short' }).success).toBe(
      false,
    );
    expect(
      RegisterSchema.safeParse({ ...valid, password: 'password1' }).success,
    ).toBe(false);
    expect(
      RegisterSchema.safeParse({ ...valid, password: 'PASSWORD' }).success,
    ).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('accepts phone + password', () => {
    const result = LoginSchema.parse({
      phone: '0912345678',
      password: 'Password1',
    });
    expect(result.phone).toBe('0912345678');
  });

  it('accepts email + password', () => {
    const result = LoginSchema.parse({
      email: 'abebe@example.com',
      password: 'Password1',
    });
    expect(result.email).toBe('abebe@example.com');
  });

  it('rejects when neither phone nor email is provided', () => {
    const result = LoginSchema.safeParse({ password: 'Password1' });
    expect(result.success).toBe(false);
  });
});

describe('SubmitVerificationSchema', () => {
  it('requires a valid id_document_url', () => {
    expect(
      SubmitVerificationSchema.safeParse({ id_document_url: 'not-a-url' }).success,
    ).toBe(false);
  });

  it('accepts optional business_license_url', () => {
    const result = SubmitVerificationSchema.parse({
      id_document_url: 'https://cdn.example.com/id.pdf',
      business_license_url: 'https://cdn.example.com/license.pdf',
    });
    expect(result.business_license_url).toContain('license.pdf');
  });

  it('accepts private object keys for id documents', () => {
    const result = SubmitVerificationSchema.parse({
      id_document_url: 'private/id_document/user-id/file.pdf',
    });
    expect(result.id_document_url).toBe(
      'private/id_document/user-id/file.pdf',
    );
  });
});

describe('RequestOtpSchema', () => {
  it('accepts an empty body', () => {
    expect(RequestOtpSchema.parse({})).toEqual({});
  });

  it('rejects unexpected fields', () => {
    expect(RequestOtpSchema.safeParse({ phone: '0912345678' }).success).toBe(
      false,
    );
  });
});

describe('VerifyOtpSchema', () => {
  it('accepts a 6-digit numeric code', () => {
    expect(VerifyOtpSchema.parse({ code: '123456' }).code).toBe('123456');
  });

  it('rejects non-numeric or wrong-length codes', () => {
    expect(VerifyOtpSchema.safeParse({ code: '12345' }).success).toBe(false);
    expect(VerifyOtpSchema.safeParse({ code: '1234567' }).success).toBe(false);
    expect(VerifyOtpSchema.safeParse({ code: 'abcdef' }).success).toBe(false);
  });
});
