export function handleApiError(error: any): string {
  if (error.response) {
    // Server responded with a status outside 2xx
    return error.response.data?.message || `Error ${error.response.status}`;
  } else if (error.request) {
    // No response from server
    return 'No response from server. Please try again.';
  } else {
    // Something else happened
    return error.message || 'Unexpected error occurred';
  }
}
