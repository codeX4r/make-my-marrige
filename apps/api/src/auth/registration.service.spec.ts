import { Test, TestingModule } from "@nestjs/testing";
import { RegistrationService } from "./registration.service.js";
import { PasswordHashService } from "./password-hash.service.js";
import { BrevoEmailAdapter } from "./email.adapter.js";
import { MONGO_CONNECTION } from "../database/database.module.js";
import { describe, it, expect, beforeEach, vi } from "vitest";

const createMockModels = () => ({
  User: {
    findOne: vi.fn().mockResolvedValue(null),
    create: vi
      .fn()
      .mockResolvedValue([
        { _id: "mock-id", emailNormalized: "test@example.com", displayName: "Test" },
      ]),
  },
  EmailVerificationToken: {
    create: vi.fn().mockResolvedValue({}),
  },
});

const createMockConnection = (models: ReturnType<typeof createMockModels>) => ({
  startSession: vi.fn().mockResolvedValue({
    withTransaction: vi.fn(async (callback: () => Promise<unknown>) => callback()),
    endSession: vi.fn(),
  }),
  models,
  model: vi.fn(() => models.User),
});

const createMockEmailAdapter = () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ accepted: true }),
});

describe("RegistrationService", () => {
  let service: RegistrationService;
  let mockConnection: ReturnType<typeof createMockConnection>;
  let mockModels: ReturnType<typeof createMockModels>;

  beforeEach(async () => {
    mockModels = createMockModels();
    mockConnection = createMockConnection(mockModels);

    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        PasswordHashService,
        { provide: BrevoEmailAdapter, useFactory: createMockEmailAdapter },
        { provide: MONGO_CONNECTION, useValue: mockConnection },
      ],
    }).compile();

    service = testingModule.get<RegistrationService>(RegistrationService);
  });

  it("should reject invalid email format", async () => {
    await expect(
      service.register({ email: "invalid", password: "password123456", displayName: "Test" }),
    ).rejects.toThrow("Invalid email address.");
  });

  it("should reject short password", async () => {
    await expect(
      service.register({ email: "test@example.com", password: "short", displayName: "Test" }),
    ).rejects.toThrow("Invalid password.");
  });
});
