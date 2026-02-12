export type AuthenticatedUser = {
  id: number;
  googleSub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};
