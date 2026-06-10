import { PersonProfile } from '@/components/People/type';
import { PEOPLE_FILTER } from '@/components/People/constants';
import { getPeople } from '@/lib/services/peopleService';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import useSWR from 'swr';

interface IProps {
  activeFilter?: string;
}

const ASSET_BASE_URL = AJAB_API_BASE;

interface ApiPerson {
  id: string;
  person_name_english?: string | null;
  person_name_hindi?: string | null;
  thumbnail_url?: string | null;
  category_name?: string | null;
  category_type?: string | null;
}

interface ApiPeopleResponse {
  status?: boolean;
  data?: ApiPerson[];
}

const toArray = (value: any) => (Array.isArray(value) ? value : []);
const toText = (...values: any[]) =>
  values.find((value) => typeof value === 'string' && value.trim().length > 0) || '';

const toAbsoluteUrl = (value: any) => {
  const source = String(value || '').trim();
  if (!source) return '';
  if (/^https?:\/\//i.test(source)) return source;
  return `${ASSET_BASE_URL}/${source.replace(/^\/+/, '')}`;
};

const splitName = (fullName: string) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
    lastName: parts.length > 1 ? parts[parts.length - 1] : null,
  };
};

const toRoles = (row: any): string[] => {
  const rawRoles: string[] = [];

  if (Array.isArray(row?.roles)) {
    rawRoles.push(...row.roles.map((role: any) => String(role || '').trim()));
  }

  rawRoles.push(
    toText(row?.category_type, row?.content_type, row?.type),
    toText(row?.director_name_english, row?.director, row?.author),
    ...String(row?.meta_keywords || '')
      .split(',')
      .map((item) => item.trim())
  );

  return Array.from(new Set(rawRoles.filter(Boolean)));
};

const normalizePeople = (payload: ApiPeopleResponse | null | undefined): PersonProfile[] => {
  const rows = toArray(payload?.data);

  return rows.map((row: any, index: number) => {
    const rawName = toText(
      row?.person_name_english,
      `Item ${index + 1}`
    );
    const name = splitName(rawName);
    const profile = toText(row?.meta_description, row?.description, row?.about_text);
    const thumbnailURL = toAbsoluteUrl(
      row?.thumbnail_url
    );

    return {
      id: Number(row?.id || index + 1),
      firstName: name.firstName,
      middleName: name.middleName,
      lastName: name.lastName,
      metaTitle: rawName,
      metaKeywords: toText(row?.category_name, row?.category_type),
      metaDescription: profile,
      firstNameInHindi: toText(row?.person_name_hindi),
      middleNameInHindi: null,
      lastNameInHindi: null,
      roles: toRoles({
        category_type: row?.category_type,
        content_type: row?.category_name,
      }),
      primaryOccupation: {
        id: 0,
        name: toText(row?.category_name, row?.category_type, 'Unknown'),
        categoryType: toText(row?.category_type, row?.category_name, 'Unknown'),
      },
      thumbnailURL,
      profile,
      display: true,
      publish: true,
    };
  });
};

const usePeople = ({ activeFilter = PEOPLE_FILTER[0] }: IProps = {}) => {
  const { data, error, isLoading } = useSWR<ApiPeopleResponse>('people', getPeople, {
    revalidateOnFocus: false,
  });

  const peopleData = normalizePeople(data);

  const filteredResults =
    activeFilter === 'ALL'
      ? peopleData
      : peopleData.filter((item) => String(item?.firstName || '').toLowerCase().startsWith(activeFilter.toLowerCase()));

  return {
    people: filteredResults,
    isLoading,
    error,
  };
};

export default usePeople;
