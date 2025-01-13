import { describe, it, expect } from 'vitest';
import { ToolDefinitionType } from '../lib/types';

describe('Tool Definition Types', () => {
  it('should validate a correct tool definition', () => {
    const toolDef: ToolDefinitionType = {
      type: 'function',
      name: 'test-tool',
      description: 'A test tool',
      parameters: {
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            description: 'Test parameter',
          },
        },
      },
      required: ['param1'],
      operation_mode: 'client_mode',
      execution_type: 'synchronous',
      result_handling: 'process_in_llm',
      code: 'console.log("test")',
      language: 'python',
      platform: 'linux',
    };

    expect(toolDef).toBeDefined();
    expect(toolDef.type).toBe('function');
  });
}); 