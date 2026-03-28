import { checkFootballMatchStatus } from '../src/utils/matchCheck';
import type { MatchCheckRequest } from '../src/types/matchCheck';

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (payload: unknown) => void;
  };
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return 'Не удалось проверить матч через API-Sports.';
}

function parseRequestBody(body: unknown): MatchCheckRequest {
  if (typeof body === 'string') {
    return JSON.parse(body) as MatchCheckRequest;
  }

  return (body ?? {}) as MatchCheckRequest;
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Content-Type', 'application/json');

  if (request.method !== 'POST') {
    response.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  try {
    const body = parseRequestBody(request.body);
    const result = await checkFootballMatchStatus(body, {
      sportsApiKey: process.env.SPORTS_API_KEY,
      sportsApiFootballBaseUrl: process.env.SPORTS_API_FOOTBALL_BASE_URL,
    });

    response.status(200).json(result);
  } catch (error) {
    response.status(500).json({
      message: getErrorMessage(error),
    });
  }
}
