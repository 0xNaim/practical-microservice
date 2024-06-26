import { config } from "@/config";
import prisma from "@/prisma";
import { EmailVerificationSchema } from "@/schemas";
import axios from "axios";
import { NextFunction, Request, Response } from "express";

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Validate the request body
		const parseBody = EmailVerificationSchema.safeParse(req.body);
		if (!parseBody.success) {
			return res.status(400).json({ errors: parseBody.error.errors });
		}

		// Check if the user with email exists
		const user = await prisma.user.findUnique({
			where: {
				email: parseBody.data.email,
			},
		});

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Find the verification code
		const verificationCode = await prisma.verificationCode.findFirst({
			where: {
				userId: user.id,
				code: parseBody.data.code,
			},
		});

		if (!verificationCode) {
			return res.status(400).json({ message: "Invalid verification code" });
		}

		// If the code has expired
		if (verificationCode.expiresAt < new Date()) {
			return res.status(400).json({ message: "Verification code expired" });
		}

		// Update user status to verified
		await prisma.user.update({
			where: { id: user.id },
			data: { verified: true, status: "ACTIVE" },
		});

		// Update verification code status to used
		await prisma.verificationCode.update({
			where: { id: verificationCode.id },
			data: { status: "USED", verifiedAt: new Date() },
		});

		// Send success email
		await axios.post(`${config.email_service_url}/emails/send`, {
			recipient: user.email,
			subject: "Email Verified",
			body: "Your email has been verified successful",
			source: "verify-email",
		});

		return res.status(200).json({ message: "Email verified successfully" });
	} catch (error) {
		next(error);
	}
};

export default verifyEmail;
