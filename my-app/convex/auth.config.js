export default {
  providers: [
    {
      // Production domain
      domain: "https://clerk.goshipgrid.app",
      applicationID: "convex",
    },
    {
      // Development/Preview domain
      domain: "https://alert-sunbeam-1.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
