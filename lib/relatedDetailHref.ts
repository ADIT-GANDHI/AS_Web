/** Detail-page href for a related API row (matches header search routes). */
export function getRelatedDetailHref(
  listBucket: string,
  item: Record<string, unknown> | null | undefined
): string | null {
  if (!item) return null;
  const id = item.id;
  if (id == null || id === '') return null;

  const routeBucket =
    listBucket === 'other' ? inferOtherRelatedBucket(item) : listBucket;

  switch (routeBucket) {
    case 'songs':
      return `/songs/details/${id}`;
    case 'poems':
      return `/poems/${id}`;
    case 'reflections':
      return `/reflections/details/${id}`;
    case 'people':
      return `/people/${id}`;
    case 'films':
      return `/films/details/${id}`;
    default:
      return null;
  }
}

function inferOtherRelatedBucket(item: Record<string, unknown>): string {
  if (item.person_name != null || item.person_name_english != null) return 'people';
  if (item.role != null || item.role_description != null || item.category_name != null) {
    return 'people';
  }
  if (item.director_name != null || item.year_of_production != null || item.film_id != null) {
    return 'films';
  }
  return 'films';
}
