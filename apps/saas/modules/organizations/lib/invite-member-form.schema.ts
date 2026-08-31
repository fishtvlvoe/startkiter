import { z } from "zod";

export const inviteMemberFormSchema = z.object({
	email: z.email(),
	role: z.enum(["user", "admin", "instructor"]),
});

export type InviteMemberFormValues = z.infer<typeof inviteMemberFormSchema>;
