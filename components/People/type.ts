export interface PersonProfile {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  firstNameInHindi: string;
  middleNameInHindi: string | null;
  lastNameInHindi: string | null;
  roles: string[];
  primaryOccupation: {
    id: number;
    name: string;
    categoryType: string;
  };
  thumbnailURL: string;
  profile: string;
  display: boolean;
  publish: boolean;
}
