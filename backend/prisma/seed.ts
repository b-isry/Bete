/**
 * Idempotent Prisma seed for Bete.
 *
 * Always seeds cities, categories, translations, and one ADMIN user.
 * Demo sellers + LIVE listings only when SEED_DEMO_DATA=true.
 *
 * NOTE ON TRANSLATIONS: non-English city/category names below use common
 * transliterations / orthographic conventions. They should be reviewed by a
 * native speaker of each language (am / om / ti / so) before production use,
 * since transliteration conventions vary.
 */
import {
  DealType,
  Locale,
  PrismaClient,
  PropertyStatus,
  PropertyType,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

type Counts = { created: number; existed: number };

const emptyCounts = (): Counts => ({ created: 0, existed: 0 });

function bump(counts: Counts, wasNew: boolean): void {
  if (wasNew) counts.created += 1;
  else counts.existed += 1;
}

type LocaleNames = Record<Locale, string>;

interface CitySeed {
  slug: string;
  region: string;
  names: LocaleNames;
}

interface CategorySeed {
  slug: string;
  names: LocaleNames;
}

// ---------------------------------------------------------------------------
// Cities (15 major Ethiopian cities across multiple regions)
// ---------------------------------------------------------------------------

const CITIES: CitySeed[] = [
  {
    slug: 'addis-ababa',
    region: 'Addis Ababa',
    names: {
      en: 'Addis Ababa',
      am: 'አዲስ አበባ',
      om: 'Finfinnee',
      ti: 'ኣዲስ ኣበባ',
      so: 'Addis Ababa',
    },
  },
  {
    slug: 'adama',
    region: 'Oromia',
    names: {
      en: 'Adama',
      am: 'አዳማ',
      om: 'Adaamaa',
      ti: 'ኣዳማ',
      so: 'Adama',
    },
  },
  {
    slug: 'bahir-dar',
    region: 'Amhara',
    names: {
      en: 'Bahir Dar',
      am: 'ባሕር ዳር',
      om: 'Baahir Daar',
      ti: 'ባሕሪ ዳር',
      so: 'Bahir Dar',
    },
  },
  {
    slug: 'mekelle',
    region: 'Tigray',
    names: {
      en: 'Mekelle',
      am: 'መቀሌ',
      om: 'Makallee',
      ti: 'መቐለ',
      so: 'Mekelle',
    },
  },
  {
    slug: 'hawassa',
    region: 'Sidama',
    names: {
      en: 'Hawassa',
      am: 'ሐዋሳ',
      om: 'Hawaasa',
      ti: 'ሓዋሳ',
      so: 'Hawassa',
    },
  },
  {
    slug: 'dire-dawa',
    region: 'Dire Dawa',
    names: {
      en: 'Dire Dawa',
      am: 'ድሬ ዳዋ',
      om: 'Dirre Dhawaa',
      ti: 'ድሬዳዋ',
      so: 'Diridhaba',
    },
  },
  {
    slug: 'gondar',
    region: 'Amhara',
    names: {
      en: 'Gondar',
      am: 'ጎንደር',
      om: 'Gondar',
      ti: 'ጎንደር',
      so: 'Gondar',
    },
  },
  {
    slug: 'jimma',
    region: 'Oromia',
    names: {
      en: 'Jimma',
      am: 'ጅማ',
      om: 'Jimmaa',
      ti: 'ጅማ',
      so: 'Jimma',
    },
  },
  {
    slug: 'dessie',
    region: 'Amhara',
    names: {
      en: 'Dessie',
      am: 'ደሴ',
      om: 'Dassee',
      ti: 'ደሴ',
      so: 'Dessie',
    },
  },
  {
    slug: 'jijiga',
    region: 'Somali',
    names: {
      en: 'Jijiga',
      am: 'ጅጅጋ',
      om: 'Jigjigaa',
      ti: 'ጅጅጋ',
      so: 'Jigjiga',
    },
  },
  {
    slug: 'shashamane',
    region: 'Oromia',
    names: {
      en: 'Shashamane',
      am: 'ሻሸመኔ',
      om: 'Shashemannee',
      ti: 'ሻሸመኔ',
      so: 'Shashamane',
    },
  },
  {
    slug: 'bishoftu',
    region: 'Oromia',
    names: {
      en: 'Bishoftu',
      am: 'ቢሾፍቱ',
      om: 'Bishooftuu',
      ti: 'ቢሾፍቱ',
      so: 'Bishoftu',
    },
  },
  {
    slug: 'arba-minch',
    region: 'South Ethiopia',
    names: {
      en: 'Arba Minch',
      am: 'አርባ ምንጭ',
      om: 'Arbaa Minchii',
      ti: 'ኣርባ ምንጭ',
      so: 'Arba Minch',
    },
  },
  {
    slug: 'harar',
    region: 'Harari',
    names: {
      en: 'Harar',
      am: 'ሐረር',
      om: 'Harar',
      ti: 'ሓረር',
      so: 'Harar',
    },
  },
  {
    slug: 'nekemte',
    region: 'Oromia',
    names: {
      en: 'Nekemte',
      am: 'ነቀምት',
      om: 'Naqamtee',
      ti: 'ነቀምት',
      so: 'Nekemte',
    },
  },
];

// ---------------------------------------------------------------------------
// Categories (9 — spanning HOUSE / APARTMENT / LAND / COMMERCIAL)
// ---------------------------------------------------------------------------

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'villa',
    names: {
      en: 'Villa',
      am: 'ቪላ',
      om: 'Viillaa',
      ti: 'ቪላ',
      so: 'Villa',
    },
  },
  {
    slug: 'family-house',
    names: {
      en: 'Family House',
      am: 'የቤተሰብ ቤት',
      om: 'Mana Maatii',
      ti: 'ናይ ስድራቤት ገዛ',
      so: 'Guri Qoys',
    },
  },
  {
    slug: 'studio-apartment',
    names: {
      en: 'Studio Apartment',
      am: 'ስቱዲዮ አፓርታማ',
      om: 'Appaartaamaa Istuudiyoo',
      ti: 'ስቱድዮ ኣፓርታማ',
      so: 'Aqal Studio',
    },
  },
  {
    slug: 'penthouse',
    names: {
      en: 'Penthouse',
      am: 'ፔንትሃውስ',
      om: 'Peenthaawusii',
      ti: 'ፔንትሃውስ',
      so: 'Penthouse',
    },
  },
  {
    slug: 'residential-land',
    names: {
      en: 'Residential Land',
      am: 'የመኖሪያ መሬት',
      om: 'Lafa Jireenyaa',
      ti: 'ናይ ኣቀማምጣ መሬት',
      so: 'Dhul Deggan',
    },
  },
  {
    slug: 'farmland',
    names: {
      en: 'Farmland',
      am: 'የእርሻ መሬት',
      om: 'Lafa Qonnaa',
      ti: 'ናይ ሕርሻ መሬት',
      so: 'Dhul Beeraha',
    },
  },
  {
    slug: 'office-space',
    names: {
      en: 'Office Space',
      am: 'የቢሮ ቦታ',
      om: 'Iddoo Waajjira',
      ti: 'ናይ ቤት ጽሕፈት ቦታ',
      so: 'Xafiis',
    },
  },
  {
    slug: 'retail-shop',
    names: {
      en: 'Retail Shop',
      am: 'የችርቻሮ ሱቅ',
      om: 'Dukkaana Gurgurtaa',
      ti: 'ናይ ዕደጎት ድኳን',
      so: 'Dukaan',
    },
  },
  {
    slug: 'warehouse',
    names: {
      en: 'Warehouse',
      am: 'መጋዘን',
      om: 'Kuusaa',
      ti: 'መኽዘን',
      so: 'Bakhaar',
    },
  },
];

const LOCALES: Locale[] = [
  Locale.en,
  Locale.am,
  Locale.om,
  Locale.ti,
  Locale.so,
];

async function upsertTranslations(
  entityType: 'CITY' | 'CATEGORY',
  entityId: string,
  names: LocaleNames,
  counts: Counts,
): Promise<void> {
  for (const locale of LOCALES) {
    const existing = await prisma.translation.findUnique({
      where: {
        entity_type_entity_id_locale_field: {
          entity_type: entityType,
          entity_id: entityId,
          locale,
          field: 'name',
        },
      },
    });

    await prisma.translation.upsert({
      where: {
        entity_type_entity_id_locale_field: {
          entity_type: entityType,
          entity_id: entityId,
          locale,
          field: 'name',
        },
      },
      create: {
        entity_type: entityType,
        entity_id: entityId,
        locale,
        field: 'name',
        value: names[locale],
      },
      update: {
        value: names[locale],
      },
    });

    bump(counts, !existing);
  }
}

async function seedCities(counts: {
  cities: Counts;
  translations: Counts;
}): Promise<Map<string, number>> {
  const bySlug = new Map<string, number>();

  for (const city of CITIES) {
    const existing = await prisma.city.findUnique({
      where: { slug: city.slug },
    });

    const row = await prisma.city.upsert({
      where: { slug: city.slug },
      create: { slug: city.slug, region: city.region },
      update: { region: city.region },
    });

    bump(counts.cities, !existing);
    bySlug.set(city.slug, row.id);

    await upsertTranslations(
      'CITY',
      String(row.id),
      city.names,
      counts.translations,
    );
  }

  return bySlug;
}

async function seedCategories(counts: {
  categories: Counts;
  translations: Counts;
}): Promise<Map<string, number>> {
  const bySlug = new Map<string, number>();

  for (const category of CATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: { slug: category.slug },
      update: {},
    });

    bump(counts.categories, !existing);
    bySlug.set(category.slug, row.id);

    await upsertTranslations(
      'CATEGORY',
      String(row.id),
      category.names,
      counts.translations,
    );
  }

  return bySlug;
}

async function seedAdminUser(counts: Counts): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@bete.local';
  const phone = process.env.SEED_ADMIN_PHONE ?? '0911000000';
  const passwordFromEnv = process.env.SEED_ADMIN_PASSWORD;
  const generatedPassword = randomBytes(18).toString('base64url');
  const password = passwordFromEnv ?? generatedPassword;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const data: {
      name: string;
      phone: string;
      role: UserRole;
      password_hash?: string;
    } = {
      name: 'Bete Admin',
      phone,
      role: UserRole.ADMIN,
    };

    // Only rotate the hash when an explicit env password is provided, so
    // re-runs with a generated password do not lock the operator out.
    if (passwordFromEnv) {
      data.password_hash = await bcrypt.hash(passwordFromEnv, BCRYPT_ROUNDS);
    }

    await prisma.user.update({
      where: { email },
      data,
    });
    bump(counts, false);
    if (passwordFromEnv) {
      console.log(
        `Admin user already existed (${email}) — password updated from SEED_ADMIN_PASSWORD.`,
      );
    } else {
      console.log(
        `Admin user already existed (${email}) — left password unchanged.`,
      );
    }
    return;
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      name: 'Bete Admin',
      email,
      phone,
      password_hash,
      role: UserRole.ADMIN,
      verification_status: VerificationStatus.UNVERIFIED,
    },
  });

  bump(counts, true);

  if (!passwordFromEnv) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SEED ADMIN CREDENTIALS (generated — save these locally)');
    console.log(`  email:    ${email}`);
    console.log(`  phone:    ${phone}`);
    console.log(`  password: ${password}`);
    console.log('  Set SEED_ADMIN_PASSWORD next time to use a fixed value.');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  } else {
    console.log(`Admin user created (${email}) using SEED_ADMIN_PASSWORD.`);
  }
}

interface DemoSellerSeed {
  email: string;
  phone: string;
  name: string;
  username: string;
  verification_status: VerificationStatus;
  password: string;
}

interface DemoPropertySeed {
  /** Stable key used for idempotent find/update (not a DB slug column). */
  seedKey: string;
  sellerEmail: string;
  citySlug: string;
  categorySlug: string;
  title: string;
  description: string;
  deal_type: DealType;
  property_type: PropertyType;
  price: string;
  area_sqm: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location_text: string;
  lat: number;
  lng: number;
  is_featured: boolean;
  imageUrls: string[];
}

const DEMO_SELLERS: DemoSellerSeed[] = [
  {
    email: 'seller.verified@bete.local',
    phone: '0911000001',
    name: 'Abebe Verified',
    username: 'abebe-verified',
    verification_status: VerificationStatus.VERIFIED,
    password: 'SellerDemo1!',
  },
  {
    email: 'seller.unverified@bete.local',
    phone: '0911000002',
    name: 'Tigist Pending',
    username: 'tigist-pending',
    verification_status: VerificationStatus.UNVERIFIED,
    password: 'SellerDemo1!',
  },
  {
    email: 'seller.hawassa@bete.local',
    phone: '0911000003',
    name: 'Lemlem Hawassa',
    username: 'lemlem-hawassa',
    verification_status: VerificationStatus.VERIFIED,
    password: 'SellerDemo1!',
  },
];

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
];

function imageHash(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}

const DEMO_PROPERTIES: DemoPropertySeed[] = [
  {
    seedKey: 'seed-bole-villa',
    sellerEmail: 'seller.verified@bete.local',
    citySlug: 'addis-ababa',
    categorySlug: 'villa',
    title: '[seed] Garden Villa in Bole',
    description:
      'Spacious 4-bedroom villa with a private garden in Bole. Ideal for families seeking modern finishes close to the airport corridor.',
    deal_type: DealType.SALE,
    property_type: PropertyType.HOUSE,
    price: '18500000.00',
    area_sqm: '200.00',
    bedrooms: 4,
    bathrooms: 3,
    location_text: 'Bole, Addis Ababa',
    lat: 8.9806,
    lng: 38.7578,
    is_featured: true,
    imageUrls: [PLACEHOLDER_IMAGES[0], PLACEHOLDER_IMAGES[1], PLACEHOLDER_IMAGES[4]],
  },
  {
    seedKey: 'seed-kirkos-apartment',
    sellerEmail: 'seller.verified@bete.local',
    citySlug: 'addis-ababa',
    categorySlug: 'studio-apartment',
    title: '[seed] Bright Studio near Meskel Square',
    description:
      'Furnished studio apartment steps from Meskel Square. Perfect for professionals who want a walkable city centre location.',
    deal_type: DealType.RENT,
    property_type: PropertyType.APARTMENT,
    price: '25000.00',
    area_sqm: '42.00',
    bedrooms: 1,
    bathrooms: 1,
    location_text: 'Kirkos, Addis Ababa',
    lat: 9.0108,
    lng: 38.7613,
    is_featured: false,
    imageUrls: [PLACEHOLDER_IMAGES[2], PLACEHOLDER_IMAGES[3]],
  },
  {
    seedKey: 'seed-bahir-dar-family',
    sellerEmail: 'seller.verified@bete.local',
    citySlug: 'bahir-dar',
    categorySlug: 'family-house',
    title: '[seed] Lake-view Family House in Bahir Dar',
    description:
      'Three-bedroom family house with lake views and a quiet compound near the Blue Nile area.',
    deal_type: DealType.SALE,
    property_type: PropertyType.HOUSE,
    price: '6800000.00',
    area_sqm: '140.00',
    bedrooms: 3,
    bathrooms: 2,
    location_text: 'Kebele 03, Bahir Dar',
    lat: 11.5742,
    lng: 37.3614,
    is_featured: true,
    imageUrls: [PLACEHOLDER_IMAGES[1], PLACEHOLDER_IMAGES[4]],
  },
  {
    seedKey: 'seed-hawassa-penthouse',
    sellerEmail: 'seller.hawassa@bete.local',
    citySlug: 'hawassa',
    categorySlug: 'penthouse',
    title: '[seed] Lake Hawassa Penthouse',
    description:
      'Top-floor penthouse overlooking Lake Hawassa with open-plan living and two parking spaces.',
    deal_type: DealType.SALE,
    property_type: PropertyType.APARTMENT,
    price: '9200000.00',
    area_sqm: '165.00',
    bedrooms: 3,
    bathrooms: 2,
    location_text: 'Tabor, Hawassa',
    lat: 7.0621,
    lng: 38.476,
    is_featured: true,
    imageUrls: [PLACEHOLDER_IMAGES[0], PLACEHOLDER_IMAGES[2], PLACEHOLDER_IMAGES[5]],
  },
  {
    seedKey: 'seed-adama-residential-land',
    sellerEmail: 'seller.verified@bete.local',
    citySlug: 'adama',
    categorySlug: 'residential-land',
    title: '[seed] Residential Plot in Adama',
    description:
      '500 sqm titled residential land on a paved access road, ready for construction.',
    deal_type: DealType.SALE,
    property_type: PropertyType.LAND,
    price: '3500000.00',
    area_sqm: '500.00',
    bedrooms: null,
    bathrooms: null,
    location_text: 'Dabe, Adama',
    lat: 8.54,
    lng: 39.27,
    is_featured: false,
    imageUrls: [PLACEHOLDER_IMAGES[5], PLACEHOLDER_IMAGES[4]],
  },
  {
    seedKey: 'seed-jimma-farmland',
    sellerEmail: 'seller.unverified@bete.local',
    citySlug: 'jimma',
    categorySlug: 'farmland',
    title: '[seed] Coffee Farmland near Jimma',
    description:
      'Two-hectare coffee farmland with mature trees and seasonal worker housing on site.',
    deal_type: DealType.SALE,
    property_type: PropertyType.LAND,
    price: '2100000.00',
    area_sqm: '20000.00',
    bedrooms: null,
    bathrooms: null,
    location_text: 'Outskirts of Jimma',
    lat: 7.6667,
    lng: 36.8333,
    is_featured: false,
    imageUrls: [PLACEHOLDER_IMAGES[4], PLACEHOLDER_IMAGES[5]],
  },
  {
    seedKey: 'seed-mekelle-office',
    sellerEmail: 'seller.verified@bete.local',
    citySlug: 'mekelle',
    categorySlug: 'office-space',
    title: '[seed] Office Floor in Mekelle CBD',
    description:
      'Open-plan office floor with generator backup and fibre internet in the city centre.',
    deal_type: DealType.RENT,
    property_type: PropertyType.COMMERCIAL,
    price: '85000.00',
    area_sqm: '220.00',
    bedrooms: null,
    bathrooms: 2,
    location_text: 'Kedamay Weyane, Mekelle',
    lat: 13.4967,
    lng: 39.4753,
    is_featured: false,
    imageUrls: [PLACEHOLDER_IMAGES[3], PLACEHOLDER_IMAGES[2]],
  },
  {
    seedKey: 'seed-dire-dawa-retail',
    sellerEmail: 'seller.hawassa@bete.local',
    citySlug: 'dire-dawa',
    categorySlug: 'retail-shop',
    title: '[seed] Retail Shop on Kezira Road',
    description:
      'Street-front retail unit with high foot traffic, suitable for fashion or electronics.',
    deal_type: DealType.RENT,
    property_type: PropertyType.COMMERCIAL,
    price: '45000.00',
    area_sqm: '60.00',
    bedrooms: null,
    bathrooms: 1,
    location_text: 'Kezira, Dire Dawa',
    lat: 9.5931,
    lng: 41.866,
    is_featured: false,
    imageUrls: [PLACEHOLDER_IMAGES[1], PLACEHOLDER_IMAGES[3], PLACEHOLDER_IMAGES[0]],
  },
  {
    seedKey: 'seed-harar-warehouse',
    sellerEmail: 'seller.verified@bete.local',
    citySlug: 'harar',
    categorySlug: 'warehouse',
    title: '[seed] Warehouse near Harar Industrial Zone',
    description:
      'Secure warehouse with loading bay and compound parking for light industrial use.',
    deal_type: DealType.SALE,
    property_type: PropertyType.COMMERCIAL,
    price: '5400000.00',
    area_sqm: '800.00',
    bedrooms: null,
    bathrooms: 1,
    location_text: 'Industrial area, Harar',
    lat: 9.3125,
    lng: 42.123,
    is_featured: false,
    imageUrls: [PLACEHOLDER_IMAGES[5], PLACEHOLDER_IMAGES[1]],
  },
  {
    seedKey: 'seed-gondar-family',
    sellerEmail: 'seller.unverified@bete.local',
    citySlug: 'gondar',
    categorySlug: 'family-house',
    title: '[seed] Courtyard House in Gondar',
    description:
      'Traditional courtyard house renovated with modern plumbing, near the historic centre.',
    deal_type: DealType.SALE,
    property_type: PropertyType.HOUSE,
    price: '4100000.00',
    area_sqm: '180.00',
    bedrooms: 5,
    bathrooms: 2,
    location_text: 'Arada, Gondar',
    lat: 12.61,
    lng: 37.46,
    is_featured: false,
    imageUrls: [PLACEHOLDER_IMAGES[4], PLACEHOLDER_IMAGES[0], PLACEHOLDER_IMAGES[2]],
  },
];

async function seedDemoData(
  cityIds: Map<string, number>,
  categoryIds: Map<string, number>,
  counts: { users: Counts; properties: Counts },
): Promise<void> {
  const sellerIds = new Map<string, string>();

  for (const seller of DEMO_SELLERS) {
    const existing = await prisma.user.findUnique({
      where: { email: seller.email },
    });
    const password_hash = await bcrypt.hash(seller.password, BCRYPT_ROUNDS);

    const row = await prisma.user.upsert({
      where: { email: seller.email },
      create: {
        name: seller.name,
        username: seller.username,
        email: seller.email,
        phone: seller.phone,
        password_hash,
        role: UserRole.SELLER,
        verification_status: seller.verification_status,
        verified_at:
          seller.verification_status === VerificationStatus.VERIFIED
            ? new Date()
            : null,
      },
      update: {
        name: seller.name,
        username: seller.username,
        phone: seller.phone,
        password_hash,
        role: UserRole.SELLER,
        verification_status: seller.verification_status,
        verified_at:
          seller.verification_status === VerificationStatus.VERIFIED
            ? existing?.verified_at ?? new Date()
            : null,
      },
    });

    bump(counts.users, !existing);
    sellerIds.set(seller.email, row.id);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  for (const listing of DEMO_PROPERTIES) {
    const sellerId = sellerIds.get(listing.sellerEmail);
    const cityId = cityIds.get(listing.citySlug);
    const categoryId = categoryIds.get(listing.categorySlug);

    if (!sellerId || cityId === undefined || categoryId === undefined) {
      throw new Error(
        `Demo listing "${listing.seedKey}" references missing seller/city/category`,
      );
    }

    // Property has no slug column — title is the stable idempotent key for seed rows.
    const existing = await prisma.property.findFirst({
      where: {
        title: listing.title,
        deleted_at: null,
      },
    });

    const propertyData = {
      seller_id: sellerId,
      city_id: cityId,
      category_id: categoryId,
      title: listing.title,
      description: listing.description,
      deal_type: listing.deal_type,
      property_type: listing.property_type,
      price: listing.price,
      area_sqm: listing.area_sqm,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      location_text: listing.location_text,
      lat: listing.lat,
      lng: listing.lng,
      status: PropertyStatus.LIVE,
      is_featured: listing.is_featured,
      expires_at: expiresAt,
    };

    let propertyId: string;

    if (existing) {
      const updated = await prisma.property.update({
        where: { id: existing.id },
        data: propertyData,
      });
      propertyId = updated.id;
      bump(counts.properties, false);

      await prisma.propertyImage.deleteMany({
        where: { property_id: propertyId },
      });
    } else {
      const created = await prisma.property.create({
        data: propertyData,
      });
      propertyId = created.id;
      bump(counts.properties, true);
    }

    await prisma.propertyImage.createMany({
      data: listing.imageUrls.map((image_url, sort_order) => ({
        property_id: propertyId,
        image_url,
        image_hash: imageHash(image_url),
        sort_order,
      })),
    });
  }
}

async function main(): Promise<void> {
  const counts = {
    cities: emptyCounts(),
    categories: emptyCounts(),
    translations: emptyCounts(),
    users: emptyCounts(),
    properties: emptyCounts(),
  };

  console.log('Seeding cities, categories, and translations…');
  const cityIds = await seedCities(counts);
  const categoryIds = await seedCategories(counts);

  console.log('Seeding admin user…');
  await seedAdminUser(counts.users);

  const seedDemo = process.env.SEED_DEMO_DATA === 'true';
  if (seedDemo) {
    console.log('SEED_DEMO_DATA=true — seeding demo sellers and LIVE listings…');
    await seedDemoData(cityIds, categoryIds, counts);
  } else {
    console.log(
      'SEED_DEMO_DATA is not true — skipping demo sellers/properties (set SEED_DEMO_DATA=true to include them).',
    );
  }

  console.log('');
  console.log('Seed summary');
  console.log('────────────');
  console.log(
    `Cities:        ${counts.cities.created} created, ${counts.cities.existed} already existed`,
  );
  console.log(
    `Categories:    ${counts.categories.created} created, ${counts.categories.existed} already existed`,
  );
  console.log(
    `Translations:  ${counts.translations.created} created, ${counts.translations.existed} already existed`,
  );
  console.log(
    `Users:         ${counts.users.created} created, ${counts.users.existed} already existed`,
  );
  console.log(
    `Properties:    ${counts.properties.created} created, ${counts.properties.existed} already existed`,
  );
}

main()
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
