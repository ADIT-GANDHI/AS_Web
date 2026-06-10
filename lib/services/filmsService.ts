import axios from 'axios'; // ✅ plain Axios, no baseURL
import { AJAB_API_BASE } from '../ajabEnv';
import { handleApiError } from '../utils/handleApiError';

export async function getPublishedFilms() {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/Api/film_list`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getReflections] API Error:', message);
    throw new Error(message);
  }
}

export async function getFilmById(filmId: string) {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/Api/explore_film`, {
      params: { film_id: filmId },
    });

    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getFilmById] API Error:', message);
    throw new Error(message);
  }
}

export async function getRelatedByFilmId(filmId: string) {
  try {
    const normalizedId = String(filmId || '').trim();
    const response = await axios.get(`${AJAB_API_BASE}/Api/related`, {
      params: { film_id: normalizedId },
    });
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getRelatedByFilmId] API Error:', message);
    throw new Error(message);
  }
}
