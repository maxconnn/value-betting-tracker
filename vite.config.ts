import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { MatchCheckRequest } from './src/types/matchCheck';
import { checkMatchStatus } from './src/utils/matchCheck';

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return 'Не удалось проверить матч через локальный server route.';
}

function sendJson(
  response: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (chunk?: string) => void;
  },
  statusCode: number,
  payload: unknown,
) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function readJsonBody(request: {
  on: (event: string, listener: (chunk?: unknown) => void) => void;
}) {
  return new Promise<unknown>((resolve, reject) => {
    let rawBody = '';

    request.on('data', (chunk) => {
      rawBody += String(chunk ?? '');
    });
    request.on('end', () => {
      if (rawBody.trim() === '') {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch {
        reject(new Error('Некорректный JSON body.'));
      }
    });
    request.on('error', () => {
      reject(new Error('Не удалось прочитать тело запроса.'));
    });
  });
}

function debugLog(event: string, payload: unknown) {
  console.debug(`[Sports match check][vite] ${event}`, payload);
}

function footballMatchRoutePlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    name: 'football-match-route',
    configureServer(server) {
      server.middlewares.use('/api/check-football-match', async (request, response) => {
        if (request.method !== 'POST') {
          sendJson(response, 405, { message: 'Method not allowed.' });
          return;
        }

        try {
          const body = await readJsonBody(request);
          const result = await checkMatchStatus(
            body as MatchCheckRequest,
            {
              sportsApiKey: env.SPORTS_API_KEY,
              sportsApiFootballBaseUrl: env.SPORTS_API_FOOTBALL_BASE_URL,
              sportsApiBasketballBaseUrl: env.SPORTS_API_BASKETBALL_BASE_URL,
              sportsApiHockeyBaseUrl: env.SPORTS_API_HOCKEY_BASE_URL,
            },
            fetch,
            {
              debugLog,
            },
          );

          sendJson(response, 200, result);
        } catch (error) {
          const message = getErrorMessage(error);
          const statusCode = message === 'Некорректный JSON body.' ? 400 : 500;

          sendJson(response, statusCode, { message });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), footballMatchRoutePlugin(mode)],
}));
