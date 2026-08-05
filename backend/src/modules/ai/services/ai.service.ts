import OpenAI from 'openai';
import { Locale } from '@prisma/client';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';
import { BadGatewayError, BadRequestError } from '../../../errors/app-error';
import { listCities } from '../../catalog/services/catalog.service';
import {
  GeneratedDescriptionSchema,
  ParsedSearchFilters,
  ParsedSearchFiltersSchema,
  WriteDescriptionBody,
} from '../schemas/ai.schema';

const MODEL = 'gpt-4o-mini';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new BadGatewayError(
      'AI service is not configured. Set OPENAI_API_KEY to enable this feature.',
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

function parseJsonContent(raw: string | null | undefined): unknown {
  if (!raw || !raw.trim()) {
    throw new BadGatewayError('AI returned an empty response');
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    logger.warn('AI returned non-JSON content');
    throw new BadGatewayError('AI returned an unusable response');
  }
}

/**
 * Parse a natural-language home search into structured filters.
 * City names are mapped to catalog `city_id` values from the database.
 */
export async function parseSearchQuery(
  query: string,
): Promise<ParsedSearchFilters> {
  const { items: cities } = await listCities(Locale.en);
  const cityCatalog = cities.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  const openai = getClient();

  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: [
            'You are a real estate search assistant for Bete, an Ethiopian property marketplace.',
            'Extract search parameters from the user\'s query.',
            'Map city names to the provided list of IDs. Only use city_id values from that list.',
            'Convert price mentions to numbers in Ethiopian Birr (ETB).',
            'Interpret phrases like "under 5 million" as max_price: 5000000.',
            'property_type must be one of: HOUSE, APARTMENT, LAND, COMMERCIAL when mentioned.',
            'Put residual free-text (neighbourhood, amenities, style) into keyword.',
            'Omit fields you cannot confidently extract.',
            'Respond with JSON only matching:',
            '{ "city_id"?: number, "property_type"?: "HOUSE"|"APARTMENT"|"LAND"|"COMMERCIAL", "min_price"?: number, "max_price"?: number, "bedrooms"?: number, "bathrooms"?: number, "keyword"?: string }',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({
            query,
            cities: cityCatalog,
          }),
        },
      ],
    });
  } catch (err) {
    logger.error(
      `OpenAI parseSearchQuery failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw new BadGatewayError('AI search parsing failed. Please try again.');
  }

  const content = completion.choices[0]?.message?.content;
  const parsedUnknown = parseJsonContent(content);
  const parsed = ParsedSearchFiltersSchema.safeParse(parsedUnknown);

  if (!parsed.success) {
    throw new BadGatewayError('AI returned invalid search filters', parsed.error.flatten());
  }

  const filters = parsed.data;

  if (filters.city_id !== undefined) {
    const valid = cityCatalog.some((c) => c.id === filters.city_id);
    if (!valid) {
      // Drop hallucinated city ids rather than failing the whole request.
      return {
        property_type: filters.property_type,
        min_price: filters.min_price,
        max_price: filters.max_price,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        keyword: filters.keyword,
      };
    }
  }

  if (
    filters.min_price !== undefined &&
    filters.max_price !== undefined &&
    filters.min_price > filters.max_price
  ) {
    return {
      ...filters,
      min_price: filters.max_price,
      max_price: filters.min_price,
    };
  }

  return filters;
}

/**
 * Generate a Heritage Editorial listing description from partial form data.
 */
export async function generateDescription(
  data: WriteDescriptionBody,
): Promise<{ description: string }> {
  const hasSignal = Object.values(data).some(
    (value) => value !== undefined && value !== null && String(value).trim() !== '',
  );
  if (!hasSignal) {
    throw new BadRequestError(
      'Provide at least one listing detail (type, location, price, etc.) to generate a description.',
    );
  }

  const openai = getClient();

  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: [
            'You are an expert real estate copywriter working for \'Bete\', a premium Ethiopian real estate platform.',
            'Write a professional, elegant, and clear property description (2-3 paragraphs) based on the provided details.',
            'Keep the tone \'Heritage Editorial\' (sophisticated but accessible).',
            'Do not invent features that aren\'t provided. Highlight the location.',
            'Prices are in Ethiopian Birr (ETB) when mentioned.',
            'Respond with JSON only: { "description": string }',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify(data),
        },
      ],
    });
  } catch (err) {
    logger.error(
      `OpenAI generateDescription failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw new BadGatewayError('AI description generation failed. Please try again.');
  }

  const content = completion.choices[0]?.message?.content;
  const parsedUnknown = parseJsonContent(content);
  const parsed = GeneratedDescriptionSchema.safeParse(parsedUnknown);

  if (!parsed.success) {
    throw new BadGatewayError(
      'AI returned an invalid description payload',
      parsed.error.flatten(),
    );
  }

  return parsed.data;
}
