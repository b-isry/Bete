export type PropertySearchItem = {
  id: string;
  title: string;
  price: string;
  price_per_sqm: string | null;
  area_sqm?: string | null;
  location_text: string;
  property_type: string;
  deal_type?: "SALE" | "RENT";
  is_featured?: boolean;
  bedrooms?: number | null;
  bathrooms?: number | null;
  images: Array<{ id: string; image_url: string; sort_order: number }>;
  seller?: {
    id: string;
    name: string;
    username: string | null;
    phone: string;
    verification_status: string;
  } | null;
};

export type PropertySearchResult = {
  items: PropertySearchItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: string;
};

export type TopSeller = {
  seller_id: string;
  name: string;
  username: string;
  verification_status: string;
  score: number;
  rank: number;
  total_views: number;
  total_contacts: number;
  response_rate: number;
  stat_line: string;
};

export type TopSellersResult = {
  sellers: TopSeller[];
};

export type SellerDirectoryItem = {
  id: string;
  username: string | null;
  name: string;
  logo_url: string | null;
  bio: string | null;
  verification_status: string;
  cities: Array<{ id: number; slug: string }>;
  active_listing_count: number;
  avg_response_time_minutes: number | null;
  score: number | null;
};

export type SellerDirectoryResult = {
  items: SellerDirectoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SellerPublicProfile = {
  id: string;
  username: string | null;
  name: string;
  bio: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  phone: string;
  whatsapp_number: string | null;
  telegram_username: string | null;
  facebook_url: string | null;
  stats: {
    active_listing_count: number;
    avg_response_time_minutes: number | null;
    total_views: number;
  };
};

export type AiParseResult = {
  keyword: string;
  chips: string[];
  summary: string;
  filters?: {
    city?: string;
    property_type?: string;
    min_price?: string;
    max_price?: string;
    bedrooms?: number;
  };
};

export const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80";

export const MOCK_SEARCH_ITEMS: PropertySearchItem[] = [
  {
    id: "mock-1",
    title: "Garden Villa in Bole",
    price: "18500000.00",
    price_per_sqm: "92500.00",
    location_text: "Bole, Addis Ababa",
    deal_type: "SALE",
    property_type: "HOUSE",
    is_featured: true,
    bedrooms: 4,
    bathrooms: 3,
    area_sqm: "200.00",
    seller: {
      id: "mock-user-seller",
      name: "Arthur Heritage",
      username: "heritage",
      phone: "+251911000001",
      verification_status: "VERIFIED",
    },
    images: [
      {
        id: "m1",
        image_url:
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
        sort_order: 0,
      },
      {
        id: "m1b",
        image_url:
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
        sort_order: 1,
      },
      {
        id: "m1c",
        image_url:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
        sort_order: 2,
      },
    ],
  },
  {
    id: "mock-2",
    title: "Bright Apartment near Meskel Square",
    price: "4200000.00",
    price_per_sqm: "70000.00",
    location_text: "Kirkos, Addis Ababa",
    deal_type: "RENT",
    property_type: "APARTMENT",
    is_featured: true,
    bedrooms: 2,
    bathrooms: 1,
    images: [
      {
        id: "m2",
        image_url:
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
        sort_order: 0,
      },
    ],
  },
  {
    id: "mock-3",
    title: "Lake-view Home in Bahir Dar",
    price: "6800000.00",
    price_per_sqm: "48500.00",
    location_text: "Bahir Dar",
    deal_type: "SALE",
    property_type: "HOUSE",
    is_featured: false,
    bedrooms: 3,
    bathrooms: 2,
    images: [
      {
        id: "m3",
        image_url:
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
        sort_order: 0,
      },
    ],
  },
  {
    id: "mock-4",
    title: "Studio Flat in Piassa",
    price: "1850000.00",
    price_per_sqm: "92000.00",
    location_text: "Arada, Addis Ababa",
    deal_type: "RENT",
    property_type: "APARTMENT",
    is_featured: false,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      {
        id: "m4",
        image_url:
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
        sort_order: 0,
      },
    ],
  },
  {
    id: "mock-5",
    title: "Courtyard Compound in Harar",
    price: "3100000.00",
    price_per_sqm: "28000.00",
    location_text: "Harar",
    deal_type: "SALE",
    property_type: "HOUSE",
    is_featured: true,
    bedrooms: 5,
    bathrooms: 2,
    images: [
      {
        id: "m5",
        image_url:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
        sort_order: 0,
      },
    ],
  },
  {
    id: "mock-6",
    title: "Commercial Plot, CMC",
    price: "12500000.00",
    price_per_sqm: null,
    location_text: "CMC, Addis Ababa",
    deal_type: "RENT",
    property_type: "LAND",
    is_featured: false,
    bedrooms: null,
    bathrooms: null,
    images: [
      {
        id: "m6",
        image_url:
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
        sort_order: 0,
      },
    ],
  },
];

export const MOCK_SEARCH_RESULT: PropertySearchResult = {
  items: MOCK_SEARCH_ITEMS,
  pagination: { page: 1, limit: 24, total: 6, totalPages: 1 },
  summary: "6 properties found",
};

export const MOCK_TOP_SELLERS: TopSeller[] = [
  {
    seller_id: "mock-seller-1",
    name: "Heritage Group",
    username: "heritage",
    verification_status: "VERIFIED",
    score: 240,
    rank: 1,
    total_views: 4200,
    total_contacts: 180,
    response_rate: 0.98,
    stat_line: "240 pts · 4,200 views · 180 contacts",
  },
  {
    seller_id: "mock-seller-2",
    name: "Noah Real Estate",
    username: "noah",
    verification_status: "VERIFIED",
    score: 210,
    rank: 2,
    total_views: 3800,
    total_contacts: 150,
    response_rate: 0.94,
    stat_line: "210 pts · 3,800 views · 150 contacts",
  },
  {
    seller_id: "mock-seller-3",
    name: "Gift Real Estate",
    username: "gift",
    verification_status: "VERIFIED",
    score: 175,
    rank: 3,
    total_views: 2100,
    total_contacts: 95,
    response_rate: 0.91,
    stat_line: "175 pts · 2,100 views · 95 contacts",
  },
  {
    seller_id: "mock-seller-4",
    name: "Flintstone Homes",
    username: "flintstone",
    verification_status: "PENDING",
    score: 140,
    rank: 4,
    total_views: 1600,
    total_contacts: 70,
    response_rate: 0.88,
    stat_line: "140 pts · 1,600 views · 70 contacts",
  },
];

export const MOCK_SELLER_DIRECTORY_ITEMS: SellerDirectoryItem[] = [
  {
    id: "mock-seller-1",
    username: "heritage",
    name: "Heritage Group",
    logo_url:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    bio: "Premium residential specialist covering Bole, Kazanchis, and Old Airport corridors.",
    verification_status: "VERIFIED",
    cities: [
      { id: 1, slug: "addis-ababa" },
      { id: 2, slug: "bahir-dar" },
    ],
    active_listing_count: 24,
    avg_response_time_minutes: 18,
    score: 240,
  },
  {
    id: "mock-seller-2",
    username: "noah",
    name: "Noah Real Estate",
    logo_url:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    bio: "Lake-city villas and family compounds from Bahir Dar to the Blue Nile shore.",
    verification_status: "VERIFIED",
    cities: [{ id: 2, slug: "bahir-dar" }],
    active_listing_count: 16,
    avg_response_time_minutes: 32,
    score: 210,
  },
  {
    id: "mock-seller-3",
    username: "gift",
    name: "Gift Real Estate",
    logo_url:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
    bio: "Apartments and commercial floors around Meskel Square and Kirkos.",
    verification_status: "VERIFIED",
    cities: [{ id: 1, slug: "addis-ababa" }],
    active_listing_count: 11,
    avg_response_time_minutes: 45,
    score: 175,
  },
  {
    id: "mock-seller-4",
    username: "flintstone",
    name: "Flintstone Homes",
    logo_url: null,
    bio: "Land parcels and shell homes for buyers ready to build.",
    verification_status: "VERIFIED",
    cities: [{ id: 1, slug: "addis-ababa" }],
    active_listing_count: 8,
    avg_response_time_minutes: null,
    score: 140,
  },
  {
    id: "mock-seller-5",
    username: "sunrise",
    name: "Sunrise Estates",
    logo_url:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    bio: "Garden villas and gated compounds across East Addis.",
    verification_status: "VERIFIED",
    cities: [{ id: 1, slug: "addis-ababa" }],
    active_listing_count: 14,
    avg_response_time_minutes: 22,
    score: 160,
  },
  {
    id: "mock-seller-6",
    username: "blue-nile",
    name: "Blue Nile Realty",
    logo_url:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    bio: "Waterfront and hillside homes with clear ETB pricing.",
    verification_status: "VERIFIED",
    cities: [{ id: 2, slug: "bahir-dar" }],
    active_listing_count: 9,
    avg_response_time_minutes: 28,
    score: 155,
  },
];

export const MOCK_SELLER_DIRECTORY: SellerDirectoryResult = {
  items: MOCK_SELLER_DIRECTORY_ITEMS,
  pagination: {
    page: 1,
    limit: 12,
    total: MOCK_SELLER_DIRECTORY_ITEMS.length,
    totalPages: 1,
  },
};

export const MOCK_SELLER_PUBLIC: SellerPublicProfile = {
  id: "mock-seller-1",
  username: "heritage",
  name: "Heritage Group",
  bio: "Premium residential specialist covering Bole, Kazanchis, and Old Airport corridors.",
  cover_image_url:
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80",
  logo_url:
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
  verification_status: "VERIFIED",
  phone: "+251911000001",
  whatsapp_number: "+251911000001",
  telegram_username: "heritage_et",
  facebook_url: null,
  stats: {
    active_listing_count: 24,
    avg_response_time_minutes: 28,
    total_views: 4200,
  },
};

export function mockAiParse(query: string): AiParseResult {
  const chips: string[] = [];
  const lower = query.toLowerCase();
  if (/\d+\s*-?\s*bed/.test(lower) || /bedroom/.test(lower)) {
    const m = lower.match(/(\d+)\s*-?\s*bed/);
    chips.push(m ? `${m[1]} Bedrooms` : "Bedrooms");
  }
  if (lower.includes("bahir")) chips.push("Bahir Dar");
  if (lower.includes("addis") || lower.includes("bole")) chips.push("Addis Ababa");
  if (lower.includes("villa") || lower.includes("house")) chips.push("House");
  if (lower.includes("apartment") || lower.includes("flat")) chips.push("Apartment");
  if (/under\s+([\d.]+)\s*m|<\s*([\d.]+)\s*m|million/.test(lower)) {
    chips.push("Budget filter");
  }
  if (chips.length === 0) chips.push("Natural language query");

  return {
    keyword: query.trim(),
    chips,
    summary:
      "Parsed locally while the AI parser endpoint is unavailable. Refine filters on the search page.",
  };
}

export type AuthUser = {
  id: string;
  name: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  whatsapp_number?: string | null;
  telegram_username?: string | null;
  facebook_url?: string | null;
  bio?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  primary_city_id?: number | null;
  role: "USER" | "SELLER" | "ADMIN";
  verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | string;
  /** ISO timestamp when OTP phone verification succeeded. Present on GET /auth/me. */
  phone_verified_at: string | null;
  /**
   * Admin rejection note for VERIFY reject.
   * Backend follow-up: currently only stored on AdminActionLog.note — not yet on /auth/me.
   */
  verification_rejection_reason?: string | null;
  created_at: string;
};

export type FavoriteItem = {
  id: string;
  property: PropertySearchItem;
  created_at: string;
};

export type MessageThread = {
  id: string;
  thread_type: "LISTING" | "SUPPORT";
  property?: { id: string; title: string } | null;
  participants: Array<{ id: string; name: string; username: string | null }>;
  last_message?: {
    message_text: string | null;
    created_at: string;
  } | null;
  unread_count: number;
  resolved_at?: string | null;
  updated_at: string;
};

export type ThreadMessage = {
  id: string;
  message_text: string | null;
  message_type: string;
  /** Presigned GET URL when the stored value was a private object key. */
  media_url?: string | null;
  created_at: string;
  sender: { id: string; name: string; username: string; role: string };
};

export const MOCK_AUTH_SELLER: AuthUser = {
  id: "mock-user-seller",
  name: "Arthur Heritage",
  username: "heritage",
  phone: "+251911000001",
  email: "arthur@heritage.et",
  role: "SELLER",
  verification_status: "UNVERIFIED",
  phone_verified_at: null,
  verification_rejection_reason: null,
  created_at: "2022-06-01T00:00:00.000Z",
};

export const MOCK_AUTH_BUYER: AuthUser = {
  id: "mock-user-buyer",
  name: "Abebe Kebede",
  username: "abebe",
  phone: "+251911000002",
  email: "abebe@example.com",
  role: "USER",
  verification_status: "UNVERIFIED",
  phone_verified_at: null,
  created_at: "2022-06-15T00:00:00.000Z",
};

export const MOCK_FAVORITES: FavoriteItem[] = MOCK_SEARCH_ITEMS.slice(0, 4).map(
  (property, index) => ({
    id: `fav-${index}`,
    property,
    created_at: new Date(Date.now() - index * 86_400_000).toISOString(),
  }),
);

export const MOCK_THREADS: MessageThread[] = [
  {
    id: "thread-1",
    thread_type: "LISTING",
    property: { id: "mock-1", title: "Garden Villa in Bole" },
    participants: [
      { id: "p1", name: "Savills Prime", username: "savills" },
      { id: MOCK_AUTH_BUYER.id, name: MOCK_AUTH_BUYER.name, username: MOCK_AUTH_BUYER.username },
    ],
    last_message: {
      message_text: "The viewing for the Bole property is confirmed.",
      created_at: new Date().toISOString(),
    },
    unread_count: 2,
    updated_at: new Date().toISOString(),
  },
  {
    id: "thread-2",
    thread_type: "LISTING",
    property: { id: "mock-2", title: "Bright Apartment near Meskel Square" },
    participants: [
      { id: "p2", name: "Noah Real Estate", username: "noah" },
      { id: MOCK_AUTH_BUYER.id, name: MOCK_AUTH_BUYER.name, username: MOCK_AUTH_BUYER.username },
    ],
    last_message: {
      message_text: "Thank you for your interest in the apartment.",
      created_at: new Date(Date.now() - 86_400_000).toISOString(),
    },
    unread_count: 0,
    updated_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "thread-support",
    thread_type: "SUPPORT",
    property: null,
    participants: [
      { id: "admin-1", name: "Bete Support", username: "support" },
      { id: MOCK_AUTH_BUYER.id, name: MOCK_AUTH_BUYER.name, username: MOCK_AUTH_BUYER.username },
    ],
    last_message: {
      message_text: "We can help with verification documents.",
      created_at: new Date(Date.now() - 3_600_000).toISOString(),
    },
    unread_count: 1,
    updated_at: new Date(Date.now() - 3_600_000).toISOString(),
  },
];

export const MOCK_THREAD_MESSAGES: ThreadMessage[] = [
  {
    id: "msg-1",
    message_text: "Hello — is the Bole villa still available for viewing this week?",
    message_type: "TEXT",
    created_at: new Date(Date.now() - 7_200_000).toISOString(),
    sender: {
      id: MOCK_AUTH_BUYER.id,
      name: MOCK_AUTH_BUYER.name,
      username: MOCK_AUTH_BUYER.username,
      role: "USER",
    },
  },
  {
    id: "msg-2",
    message_text: "Yes, Thursday at 10:00 works. The viewing for the Bole property is confirmed.",
    message_type: "TEXT",
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
    sender: {
      id: "p1",
      name: "Savills Prime",
      username: "savills",
      role: "SELLER",
    },
  },
];

export type SellerListing = PropertySearchItem & {
  status:
    | "PENDING"
    | "LIVE"
    | "EXPIRED"
    | "REJECTED"
    | "REMOVED"
    | "AUTO_HIDDEN";
  view_count: number;
  contact_count: number;
  rejection_reason?: string | null;
};

export const MOCK_AUTH_ADMIN: AuthUser = {
  id: "mock-user-admin",
  name: "Admin User",
  username: "admin",
  phone: "+251911000099",
  email: "admin@bete.et",
  role: "ADMIN",
  verification_status: "UNVERIFIED",
  phone_verified_at: null,
  created_at: "2022-01-01T00:00:00.000Z",
};

export type AdminOverview = {
  pending_listings: number;
  pending_verifications: number;
  active_reports: number;
  monthly_revenue_etb: string;
  listing_volume: number[];
  total_new_listings: number;
  avg_daily_submissions: number;
  conversion_rate: number;
};

export type PendingListingFlag = {
  id: string;
  flag_type: string;
  message: string;
  resolved: boolean;
};

export type PendingListing = PropertySearchItem & {
  status: "PENDING";
  created_at: string;
  flags: PendingListingFlag[];
  seller: {
    id: string;
    name: string;
    username: string | null;
    phone: string;
    verification_status: string;
  };
};

export type PendingVerification = {
  id: string;
  name: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  verification_status: "PENDING";
  created_at: string;
  doc_count: number;
  trust_score: number;
  location_text: string;
  account_type: string;
  bio: string;
};

export type AdminAnalytics = {
  revenue_total_etb: string;
  revenue_growth_pct: number;
  boost_revenue_etb: string;
  new_listings_month: number;
  closed_transactions: number;
  conversion_efficiency: number;
  tiers: Array<{ label: string; pct: number }>;
  agencies: Array<{
    name: string;
    volume: number;
    growth_pct: number;
    revenue_etb: string;
  }>;
  monthly_series: number[];
};

export const MOCK_ADMIN_OVERVIEW: AdminOverview = {
  pending_listings: 142,
  pending_verifications: 28,
  active_reports: 12,
  monthly_revenue_etb: "4200000",
  listing_volume: [40, 55, 35, 85, 60, 70, 50, 90, 45, 30, 100, 65],
  total_new_listings: 1842,
  avg_daily_submissions: 62,
  conversion_rate: 4.8,
};

export const MOCK_PENDING_LISTINGS: PendingListing[] = MOCK_SEARCH_ITEMS.slice(
  0,
  4,
).map((item, index) => ({
  ...item,
  status: "PENDING",
  created_at: new Date(Date.now() - (index + 1) * 7_200_000).toISOString(),
  flags:
    index === 0
      ? [
          {
            id: "f1",
            flag_type: "LOW_RES",
            message: "Image resolution below marketplace minimum.",
            resolved: false,
          },
          {
            id: "f2",
            flag_type: "VERIFY_DOC",
            message: "Title document needs manual review.",
            resolved: false,
          },
        ]
      : index === 2
        ? [
            {
              id: "f3",
              flag_type: "DUPE",
              message: "Visual similarity detected with an active listing.",
              resolved: false,
            },
          ]
        : [],
  seller: {
    id: `seller-${index}`,
    name: ["Eleanor Vance", "Julian Thorne", "Aiko Tanaka", "Marcus Reed"][
      index
    ],
    username: ["eleanor", "julian", "aiko", "marcus"][index],
    phone: `+25191100000${index + 1}`,
    verification_status: index % 2 === 0 ? "VERIFIED" : "PENDING",
  },
}));

export const MOCK_PENDING_VERIFICATIONS: PendingVerification[] = [
  {
    id: "verify-1",
    name: "Aethelgard Estates",
    username: "aethelgard",
    phone: "+251911111111",
    email: "ops@aethelgard.et",
    verification_status: "PENDING",
    created_at: new Date(Date.now() - 7_200_000).toISOString(),
    doc_count: 3,
    trust_score: 85,
    location_text: "Addis Ababa, Bole",
    account_type: "Agency",
    bio: "Premium brokerage specializing in residential restorations across Addis Ababa.",
  },
  {
    id: "verify-2",
    name: "Northline Realty",
    username: "northline",
    phone: "+251911222222",
    email: "hello@northline.et",
    verification_status: "PENDING",
    created_at: new Date(Date.now() - 18_000_000).toISOString(),
    doc_count: 2,
    trust_score: 72,
    location_text: "Bahir Dar",
    account_type: "Agency",
    bio: "Lakeside residential and mixed-use specialists.",
  },
  {
    id: "verify-3",
    name: "Aurum Concierge",
    username: "aurum",
    phone: "+251911333333",
    email: "team@aurum.et",
    verification_status: "PENDING",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
    doc_count: 4,
    trust_score: 91,
    location_text: "Addis Ababa, Kazanchis",
    account_type: "Agency",
    bio: "Concierge-led sales for high-value apartments.",
  },
];

export const MOCK_ADMIN_ANALYTICS: AdminAnalytics = {
  revenue_total_etb: "2840000",
  revenue_growth_pct: 12.4,
  boost_revenue_etb: "420000",
  new_listings_month: 1248,
  closed_transactions: 892,
  conversion_efficiency: 71.4,
  tiers: [
    { label: "Estate Enterprise", pct: 42 },
    { label: "Boutique Premium", pct: 35 },
    { label: "Individual Pro", pct: 23 },
  ],
  agencies: [
    {
      name: "Heritage Global Realty",
      volume: 428,
      growth_pct: 18.2,
      revenue_etb: "842000",
    },
    {
      name: "Vanguard Estates",
      volume: 312,
      growth_pct: 4.5,
      revenue_etb: "615200",
    },
    {
      name: "Savills Prime Addis",
      volume: 265,
      growth_pct: 9.1,
      revenue_etb: "498000",
    },
  ],
  monthly_series: [40, 45, 42, 55, 62, 70, 78],
};

export type AdminUserRow = {
  id: string;
  name: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  role: "USER" | "SELLER" | "ADMIN";
  verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  created_at: string;
};

export type AdminCategoryRow = {
  id: number;
  slug: string;
  name: string;
  listing_count: number;
};

export type AdminReportProperty = {
  id: string;
  title: string;
  status: "AUTO_HIDDEN" | "LIVE" | "PENDING";
  price: string;
  seller: { id: string; name: string; verification_status: string };
  reports: Array<{
    id: string;
    reason: string;
    status: "PENDING" | "RESOLVED" | "DISMISSED";
    note: string | null;
    created_at: string;
    reporter: { id: string; name: string };
  }>;
  _count: { reports: number };
};

export const MOCK_ADMIN_USERS: AdminUserRow[] = [
  {
    id: "u-1",
    name: "Abebe Kebede",
    username: "abebe",
    phone: "0911000001",
    email: "abebe@example.com",
    role: "USER",
    verification_status: "UNVERIFIED",
    created_at: "2024-02-01T00:00:00.000Z",
  },
  {
    id: "u-2",
    name: "Arthur Heritage",
    username: "heritage",
    phone: "0911000002",
    email: "arthur@heritage.et",
    role: "SELLER",
    verification_status: "VERIFIED",
    created_at: "2023-06-01T00:00:00.000Z",
  },
  {
    id: "u-3",
    name: "Northline Realty",
    username: "northline",
    phone: "0911000003",
    email: "hello@northline.et",
    role: "SELLER",
    verification_status: "PENDING",
    created_at: "2025-11-12T00:00:00.000Z",
  },
  {
    id: "u-4",
    name: "Admin User",
    username: "admin",
    phone: "0911000099",
    email: "admin@bete.et",
    role: "ADMIN",
    verification_status: "UNVERIFIED",
    created_at: "2022-01-01T00:00:00.000Z",
  },
];

export const MOCK_ADMIN_CATEGORIES: AdminCategoryRow[] = [
  { id: 1, slug: "residential", name: "Residential", listing_count: 842 },
  { id: 2, slug: "commercial", name: "Commercial", listing_count: 214 },
  { id: 3, slug: "land", name: "Land", listing_count: 156 },
  { id: 4, slug: "heritage", name: "Heritage", listing_count: 48 },
];

export const MOCK_CITIES = [
  { id: 1, slug: "addis-ababa", name: "Addis Ababa" },
  { id: 2, slug: "bahir-dar", name: "Bahir Dar" },
  { id: 3, slug: "harar", name: "Harar" },
];

export const MOCK_ADMIN_REPORTS: AdminReportProperty[] = [
  {
    id: "rep-prop-1",
    title: "Suspicious villa near Bole",
    status: "AUTO_HIDDEN",
    price: "18500000",
    seller: {
      id: "u-3",
      name: "Northline Realty",
      verification_status: "PENDING",
    },
    reports: [
      {
        id: "r-1",
        reason: "SCAM",
        status: "PENDING",
        note: "Seller asked for bank transfer before viewing.",
        created_at: new Date(Date.now() - 86_400_000).toISOString(),
        reporter: { id: "u-1", name: "Abebe Kebede" },
      },
      {
        id: "r-2",
        reason: "FAKE",
        status: "PENDING",
        note: null,
        created_at: new Date(Date.now() - 72_000_000).toISOString(),
        reporter: { id: "u-2", name: "Arthur Heritage" },
      },
      {
        id: "r-3",
        reason: "WRONG_PRICE",
        status: "PENDING",
        note: "Price far below comps.",
        created_at: new Date(Date.now() - 36_000_000).toISOString(),
        reporter: { id: "u-1", name: "Abebe Kebede" },
      },
    ],
    _count: { reports: 3 },
  },
];

export function mockAiDescription(input: {
  title: string;
  location_text: string;
  property_type: string;
}): string {
  return `${input.title} is a carefully positioned ${input.property_type.toLowerCase()} in ${input.location_text}. Bright rooms, practical circulation, and strong neighbourhood access make it suitable for buyers seeking lasting value in Ethiopian Birr. Schedule a daylight viewing to confirm finishes, measurements, and ownership documents before any payment.`;
}


