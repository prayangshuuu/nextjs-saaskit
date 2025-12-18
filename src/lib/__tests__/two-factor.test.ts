import { describe, it, expect } from "vitest";
import { generateSecret, verifyTOTP, generateRecoveryCodes, hashRecoveryCode, verifyRecoveryCode } from "../two-factor";

describe("Two-Factor Authentication", () => {
  describe("generateSecret", () => {
    it("should generate a secret", () => {
      const result = generateSecret("test@example.com", "Test App");
      
      expect(result.secret).toBeDefined();
      expect(result.otpauthUrl).toBeDefined();
      expect(result.secret.length).toBeGreaterThan(0);
      expect(result.otpauthUrl).toContain("otpauth://totp");
    });
  });

  describe("verifyTOTP", () => {
    it("should verify a valid TOTP token", () => {
      const { secret } = generateSecret("test@example.com");
      
      // Generate a token using the secret
      const speakeasy = require("speakeasy");
      const token = speakeasy.totp({
        secret,
        encoding: "base32",
      });
      
      const isValid = verifyTOTP(secret, token);
      expect(isValid).toBe(true);
    });

    it("should reject an invalid TOTP token", () => {
      const { secret } = generateSecret("test@example.com");
      const invalidToken = "000000";
      
      const isValid = verifyTOTP(secret, invalidToken);
      expect(isValid).toBe(false);
    });
  });

  describe("generateRecoveryCodes", () => {
    it("should generate recovery codes", () => {
      const codes = generateRecoveryCodes(10);
      
      expect(codes).toHaveLength(10);
      codes.forEach((code) => {
        expect(code).toBeDefined();
        expect(typeof code).toBe("string");
        expect(code.length).toBeGreaterThan(0);
      });
    });

    it("should generate unique codes", () => {
      const codes = generateRecoveryCodes(10);
      const uniqueCodes = new Set(codes);
      
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe("hashRecoveryCode and verifyRecoveryCode", () => {
    it("should hash and verify recovery codes", async () => {
      const code = "ABC12345";
      const hash = await hashRecoveryCode(code);
      const isValid = await verifyRecoveryCode(code, hash);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(code);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect recovery code", async () => {
      const code = "ABC12345";
      const wrongCode = "XYZ67890";
      const hash = await hashRecoveryCode(code);
      const isValid = await verifyRecoveryCode(wrongCode, hash);
      
      expect(isValid).toBe(false);
    });
  });
});

