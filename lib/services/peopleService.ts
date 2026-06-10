import axios from 'axios';
import { AJAB_API_BASE } from '../ajabEnv';
import { handleApiError } from '../utils/handleApiError';

export async function getPeople() {
  try {
    const response = await axios.get(`${AJAB_API_BASE}/Api/person_list`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getPeople] API Error:', message);
    throw new Error(message);
  }
}

export async function getPersonById(personId: string) {
  try {
    const normalizedId = String(personId || '').trim();
    const response = await axios.get(`${AJAB_API_BASE}/Api/explore_person`, {
      params: {
        person_id: normalizedId,
      },
    });
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getPersonById] API Error:', message);
    throw new Error(message);
  }
}

export async function getRelatedByPeopleId(personId: string) {
  const normalizedId = String(personId || '').trim();

  try {
    const response = await axios.get(`${AJAB_API_BASE}/Api/related`, {
      params: {
        people_id: normalizedId,
      },
    });
    return response.data;
  } catch {
    try {
      const fallbackResponse = await axios.get(`${AJAB_API_BASE}/Api/related`, {
        params: {
          person_id: normalizedId,
        },
      });
      return fallbackResponse.data;
    } catch (error) {
      const message = handleApiError(error);
      console.error('[getRelatedByPeopleId] API Error:', message);
      throw new Error(message);
    }
  }
}
