export type SubmissionStatus =
  | "UNREVIEWED"
  | "IN_REVIEW"
  | "REVIEWED"
  | "APPROVED_FOR_STORY"
  | "REJECTED"
  | "ARCHIVED";

export const submissionStatuses = [
  "UNREVIEWED",
  "IN_REVIEW",
  "REVIEWED",
  "APPROVED_FOR_STORY",
  "REJECTED",
  "ARCHIVED"
] as const satisfies readonly SubmissionStatus[];

export type SubmissionInput = {
  submitterName: string;
  contact?: string;
  encounterDate?: string;
  isApproximateDate?: boolean;
  locationName?: string;
  city?: string;
  region?: string;
  country?: string;
  eventName?: string;
  howMet?: string;
  memoryText: string;
  beforeText?: string;
  afterText?: string;
  metAgain?: string;
  peoplePresent?: string;
  yerielWearing?: string;
  submitterWearing?: string;
  talkedAbout?: string;
  exchanged?: string;
  artifactInfo?: string;
  forgottenPrompt?: string;
  bookPagePrompt?: string;
  additionalComments?: string;
};

export type ReviewInput = {
  status: SubmissionStatus;
  notes?: string;
  remembered?: string;
  corrections?: string;
  context?: string;
  people?: string;
  tags?: string;
  importance?: number;
  emotionalSignificance?: number;
  historicalSignificance?: number;
  accuracyConfidence?: number;
  bookPotential?: number;
  chapterCategory?: string;
  privateNotes?: string;
};
