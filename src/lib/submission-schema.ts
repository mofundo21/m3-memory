import { z } from "zod";

export const submissionSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  instagram: z.string().trim().max(200).optional().default(""),
  dateCertainty: z.enum(["exact", "approximate", "unknown"]),
  occurredOn: z.string().optional().default(""),
  approximateDateText: z.string().trim().max(200).optional().default(""),
  eventName: z.string().trim().max(200).optional().default(""),
  venue: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  region: z.string().trim().max(120).optional().default(""),
  country: z.string().trim().max(120).optional().default(""),
  story: z.string().trim().min(20).max(20000),
  conversationDetails: z.string().trim().max(10000).optional().default(""),
  mofundoWearing: z.string().trim().max(4000).optional().default(""),
  contributorWearing: z.string().trim().max(4000).optional().default(""),
  firstImpression: z.string().trim().max(10000).optional().default(""),
  meaningfulDetails: z.string().trim().max(10000).optional().default(""),
  thingsExchanged: z.string().trim().max(10000).optional().default(""),
  forgottenDetail: z.string().trim().max(10000).optional().default(""),
  bookPageMessage: z.string().trim().max(10000).optional().default(""),
  archiveStorage: z.literal(true),
  truthful: z.literal(true),
  mediaRights: z.literal(true),
  publicWebsite: z.boolean().default(false),
  bookEditorial: z.boolean().default(false),
  displayPublicName: z.boolean().default(false),
  displaySocial: z.boolean().default(false),
  followUpContact: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.dateCertainty === "exact" && !value.occurredOn) context.addIssue({ code: "custom", path: ["occurredOn"], message: "Choose the exact date." });
  if (value.dateCertainty === "approximate" && !value.approximateDateText) context.addIssue({ code: "custom", path: ["approximateDateText"], message: "Describe the approximate date." });
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
