import axios from 'axios';
import { AJAB_API_BASE } from '../ajabEnv';
import { handleApiError } from '../utils/handleApiError';

interface PoemsQueryParams {
  poet?: string;
  theme?: string;
}

interface RelatedQueryParams {
  poem_id: string;
}

export async function getPublishedPoems(params?: PoemsQueryParams) {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/Api/poems`, {
      params,
    });
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getPublishedPoems] API Error:', message);
    throw new Error(message);
  }
}

export async function getPoemFilters() {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/Api/poem_filters`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getPoemFilters] API Error:', message);
    throw new Error(message);
  }
}

export async function getPublishedPoemsById(id: string) {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/Api/poems/${id}`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getPublishedPoemsById] API Error:', message);
    throw new Error(message);
  }
}

export async function getPublishedPoemAudio(params?: { page?: number; limit?: number }) {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/api/poem/getPublished`, {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 12 },
    });
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getPublishedPoemAudio] API Error:', message);
    throw new Error(message);
  }
}

export async function getPoemAudioById(id: string) {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/api/poem/getById/${id}`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getPoemAudioById] API Error:', message);
    throw new Error(message);
  }
}

export async function getRelatedByPoemId(poemId: string) {
  try {
    const params: RelatedQueryParams = { poem_id: poemId };
    const response = await axios.get(`${AJAB_API_BASE}/Api/related`, {
      params,
    });
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getRelatedByPoemId] API Error:', message);
    throw new Error(message);
  }
}
