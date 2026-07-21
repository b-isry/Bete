import { PropertyCreateSchema } from '../schemas/property-create.schema';

const validPayload = {
  title: 'Spacious apartment near lake',
  description: 'A bright two-bedroom apartment with lake views.',
  deal_type: 'SALE' as const,
  property_type: 'APARTMENT' as const,
  price: '1800000',
  area_sqm: '90.5',
  bedrooms: 2,
  bathrooms: 1,
  location_text: 'Kebele 03, Bahir Dar',
  lat: 11.59,
  lng: 37.38,
  city_id: 3,
  category_id: 1,
  images: [
    {
      image_url: 'https://cdn.example.com/a.jpg',
      image_hash: 'abcdef1234567890',
    },
  ],
};

describe('PropertyCreateSchema', () => {
  it('accepts a valid create payload', () => {
    const result = PropertyCreateSchema.parse(validPayload);
    expect(result.title).toBe(validPayload.title);
    expect(result.images).toHaveLength(1);
  });

  it('rejects short titles and non-positive prices', () => {
    expect(
      PropertyCreateSchema.safeParse({ ...validPayload, title: 'Hi' }).success,
    ).toBe(false);
    expect(
      PropertyCreateSchema.safeParse({ ...validPayload, price: '0' }).success,
    ).toBe(false);
  });

  it('rejects more than 10 images', () => {
    const images = Array.from({ length: 11 }, (_, i) => ({
      image_url: `https://cdn.example.com/${i}.jpg`,
      image_hash: `hashhashhash${i}`,
    }));
    expect(
      PropertyCreateSchema.safeParse({ ...validPayload, images }).success,
    ).toBe(false);
  });
});
