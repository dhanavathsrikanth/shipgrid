export default {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL,
      applicationID: "convex", // This should match the Audience ('aud') claim in your Clerk JWT template
    },
  ],
};
