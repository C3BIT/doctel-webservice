const errorCodes = {
    40001: {
      reason: "ValidationInvalidField",
      message: "Invalid parameter(s)",
    },
    40005: {
      reason: "ValidationError",
      message: "Email is already in use",
    },
    40006: {
      reason: "ValidationError",
      message: "Phone is already in use",
    },
    40007: {
      reason: "ValidationInvalidField",
      message: "Email format is not valid",
    },
    40008: {
      reason: "ValidationInvalidField",
      message: "Phone format is not valid",
    },
    40009: {
      reason: "ValidationError",
      message: "Phone number is not valid",
    },
    40102: {
      reason: "InvalidPassword",
      message: "Invalid password. Please try again.",
    },
    40103: {
      reason: "Blocked",
      message: "Your account is blocked. Please contact to customer support.",
    },
    40106: {
      reason: "UserUnverified",
      message: "User must verify phone number",
    },
    40107: {
      reason: "UserUnverified",
      message: "Old password does not matched",
    },
    // ================== Authorizer error codes ==================
    40110: {
      reason: "TokenExpired",
      message: "Authentication failed: Token has expired'",
    },
    40111: {
      reason: "InvalidToken",
      message: "Token validation fail",
    },
    40112: {
      reason: "InvalidToken",
      message: "Token verification fail",
    },
    40113: {
      reason: "NoTokenProvided",
      message: "Authentication failed: No token provided",
    },
    40114: {
      reason: "InsufficientPrivileges",
      message: "Access denied. Admin privileges required.",
    },
    40125: {
      reason: "PasswordValidationError",
      message: "Wrong password.",
    },
    40401: {
      reason: "NotFound",
      message: "User not found",
    },
    50001: {
      reason: "UnknownError",
      message: "An unknown error occurred.",
    },
  };
  
  module.exports = { errorCodes };