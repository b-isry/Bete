import express, { Application } from 'express';
import request from 'supertest';
import { errorMiddleware } from '../../../middlewares/error.middleware';
import { geocodingRouter } from '../routes/geocoding.routes';

function createTestApp(): Application {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/geocode', geocodingRouter);
  app.use(errorMiddleware);
  return app;
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

describe('geocoding routes', () => {
  const app = createTestApp();

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  beforeEach(() => {
    fetchMock.mockReset();
  });

  describe('GET /api/v1/geocode/search', () => {
    it('maps Nominatim places to display_name/lat/lng', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          {
            display_name: 'Bole Road, Addis Ababa, Ethiopia',
            lat: '9.0084086',
            lon: '38.764961',
          },
        ]),
      );

      const res = await request(app)
        .get('/api/v1/geocode/search')
        .query({ q: 'bole road' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toEqual([
        {
          display_name: 'Bole Road, Addis Ababa, Ethiopia',
          lat: 9.0084086,
          lng: 38.764961,
        },
      ]);

      const [url, init] = fetchMock.mock.calls[0];
      const requested = url instanceof URL ? url : new URL(String(url));
      expect(requested.pathname).toBe('/search');
      expect(requested.searchParams.get('countrycodes')).toBe('et');
      expect(requested.searchParams.get('format')).toBe('jsonv2');
      const headers = init?.headers as Record<string, string>;
      expect(headers['User-Agent']).toContain('Bete');
    });

    it('serves repeated queries from cache without calling Nominatim again', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          { display_name: 'Kazanchis, Addis Ababa', lat: '9.01', lon: '38.76' },
        ]),
      );

      await request(app).get('/api/v1/geocode/search').query({ q: 'kazanchis' });
      await request(app).get('/api/v1/geocode/search').query({ q: 'KAZANCHIS' });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejects queries shorter than 3 characters', async () => {
      const res = await request(app)
        .get('/api/v1/geocode/search')
        .query({ q: 'bo' });

      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/geocode/reverse', () => {
    it('returns the resolved display_name', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ display_name: 'Yared Street, Addis Ababa' }),
      );

      const res = await request(app)
        .get('/api/v1/geocode/reverse')
        .query({ lat: '9.0192', lng: '38.7525' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        display_name: 'Yared Street, Addis Ababa',
      });

      const [url] = fetchMock.mock.calls[0];
      const requested = url instanceof URL ? url : new URL(String(url));
      expect(requested.pathname).toBe('/reverse');
      expect(requested.searchParams.get('lat')).toBe('9.0192');
      expect(requested.searchParams.get('lon')).toBe('38.7525');
    });

    it('rejects coordinates outside valid ranges', async () => {
      const res = await request(app)
        .get('/api/v1/geocode/reverse')
        .query({ lat: '120', lng: '38.75' });

      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('404s when Nominatim cannot geocode the point', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: 'Unable to geocode' }),
      );

      const res = await request(app)
        .get('/api/v1/geocode/reverse')
        .query({ lat: '1.234', lng: '2.345' });

      expect(res.status).toBe(404);
    });
  });
});
