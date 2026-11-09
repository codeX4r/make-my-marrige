export type AuthenticatedPrincipal = Readonly<{
  userId: string;
  sessionId: string;
  tokenId: string;
  issuedAt: Date;
  expiresAt: Date;
}>;

export type AccessTokenClaims = Readonly<{
  sub: string;
  sid: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
}>;

export type SessionTokens = Readonly<{
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  sessionId: string;
  familyId: string;
  refreshExpiresAt: Date;
}>;
