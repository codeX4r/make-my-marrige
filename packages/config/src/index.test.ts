import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseEnvironment } from "./index.js";

describe("parseEnvironment", () => {
  const schema = z.object({ PORT: z.coerce.number().int().positive() });

  it("parses validated values", () => {
    expect(parseEnvironment(schema, { PORT: "4000" })).toEqual({ PORT: 4000 });
  });

  it("rejects invalid values", () => {
    expect(() => parseEnvironment(schema, { PORT: "0" })).toThrow();
  });
});
