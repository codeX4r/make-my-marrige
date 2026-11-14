import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MONGO_CONNECTION } from "../database/database.module.js";
import { LoginService } from "./login.service.js";
import { MemberSessionService } from "./member-session.service.js";
import { PasswordHashService } from "./password-hash.service.js";

const createMockModels = () => ({
  User: {
    findOne: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    }),
  },
});

type MockModels = ReturnType<typeof createMockModels>;

const createMockConnection = (models: MockModels) => ({
  models,
  model: vi.fn((name: string) => models[name as keyof MockModels] ?? {}),
});

describe("LoginService", () => {
  let service: LoginService;
  let mockModels: MockModels;
  let mockPasswordHashService: Partial<PasswordHashService>;
  let mockMemberSessionService: Partial<MemberSessionService>;

  beforeEach(async () => {
    mockModels = createMockModels();
    const mockConnection = createMockConnection(mockModels);
    mockPasswordHashService = { verify: vi.fn() };
    mockMemberSessionService = { create: vi.fn() };

    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        { provide: MONGO_CONNECTION, useValue: mockConnection },
        { provide: PasswordHashService, useValue: mockPasswordHashService },
        { provide: MemberSessionService, useValue: mockMemberSessionService },
      ],
    }).compile();

    service = testingModule.get<LoginService>(LoginService);
  });

  it("should reject empty email", async () => {
    await expect(service.login({ email: "", password: "password123456" })).rejects.toThrow(
      "Invalid email or password format.",
    );
  });

  it("should reject unknown email", async () => {
    mockModels.User.findOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.login({ email: "test@example.com", password: "password123456" }),
    ).rejects.toThrow("Invalid email or password.");
  });
});
