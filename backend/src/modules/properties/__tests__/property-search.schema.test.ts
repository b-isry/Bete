import { PropertySearchSchema, PropertyIdParamsSchema } from '../schemas/property-search.schema';

describe('PropertySearchSchema', () => {
  it('applies default page, limit, and sort_by', () => {
    const result = PropertySearchSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sort_by).toBe('newest');
  });

  it('parses filters and coerces numeric query params', () => {
    const result = PropertySearchSchema.parse({
      min_price: '1500000',
      max_price: '2000000.50',
      deal_type: 'SALE',
      property_type: 'APARTMENT',
      city_id: '3',
      bedrooms: '2',
      bathrooms: '1',
      keyword: 'lake view',
      seller_username: 'bekele-homes',
      sort_by: 'price_asc',
      page: '2',
      limit: '10',
      locale: 'am',
    });

    expect(result).toMatchObject({
      min_price: '1500000',
      max_price: '2000000.50',
      deal_type: 'SALE',
      property_type: 'APARTMENT',
      city_id: 3,
      bedrooms: 2,
      bathrooms: 1,
      keyword: 'lake view',
      seller_username: 'bekele-homes',
      sort_by: 'price_asc',
      page: 2,
      limit: 10,
      locale: 'am',
    });
  });

  it('rejects invalid decimal prices and sort values', () => {
    expect(
      PropertySearchSchema.safeParse({ min_price: '1.5M' }).success,
    ).toBe(false);
    expect(
      PropertySearchSchema.safeParse({ sort_by: 'popular' }).success,
    ).toBe(false);
    expect(PropertySearchSchema.safeParse({ limit: '0' }).success).toBe(false);
  });
});

describe('PropertyIdParamsSchema', () => {
  it('requires a UUID property id', () => {
    expect(
      PropertyIdParamsSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
    ).toBe(true);
    expect(PropertyIdParamsSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(
      false,
    );
  });
});
