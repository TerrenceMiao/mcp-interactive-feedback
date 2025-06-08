/**
 * Basic Functionality Tests
 */

describe('Basic Functionality', () => {
  test('should be able to run tests', () => {
    expect(1 + 1).toBe(2);
  });

  test('should be able to import types', async () => {
    const { MCPError } = await import('../types/index');
    expect(MCPError).toBeDefined();
  });
});
