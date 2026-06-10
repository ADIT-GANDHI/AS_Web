import axios from 'axios';
import { AJAB_API_BASE } from '../ajabEnv';
import { handleApiError } from '../utils/handleApiError';

export async function getPublishedReflections() {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/Api/reflection_list`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getReflections] API Error:', message);
    throw new Error(message);
  }
}

export async function getReflectionFilters() {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/Api/reflection_filter`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getReflectionFilters] API Error:', message);
    throw new Error(message);
  }
}

export async function getReflectionById(reflectionId: string) {
  try {
    const normalizedId = String(reflectionId || '').trim();
    const response = await axios.get(`${AJAB_API_BASE}/Api/explore_reflection`, {
      params: {
        reflection_id: normalizedId,
      },
    });
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getReflectionById] API Error:', message);
    throw new Error(message);
  }
}

export async function getRelatedByReflectionId(reflectionId: string) {
  try {
    const normalizedId = String(reflectionId || '').trim();
    const response = await axios.get(`${AJAB_API_BASE}/Api/related`, {
      params: {
        reflection_id: normalizedId,
      },
    });
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getRelatedByReflectionId] API Error:', message);
    throw new Error(message);
  }
}
