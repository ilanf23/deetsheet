export interface LinkedInProfileData {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  education?: string;
  highSchool?: string;
  college?: string;
  degree?: string;
  major?: string;
  job?: string;
  credentials?: Array<{ icon: string; text: string }>;
  expertiseTopics?: string[];
}
