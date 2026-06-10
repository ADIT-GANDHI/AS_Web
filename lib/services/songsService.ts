import axios from 'axios';
import { handleApiError } from '../utils/handleApiError';

export async function getPublishedSongs() {
  try {
    const response = await axios.get('https://ajabshahar.com/api/songs/getPublishedSongs');
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getPublishedSongs] API Error:', message);
    throw new Error(message);
  }
}

export async function getPublishedSongsById(id: string) {
  try {
    const response = await axios.get(`https://ajabshahar.com/api/songs/getPublishedSongs/${id}`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    console.error('[getPublishedSongsById] API Error:', message);
    throw new Error(message);
  }
}
