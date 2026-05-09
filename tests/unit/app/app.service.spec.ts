import { AppService } from 'src/app.service';

describe('AppService Tests', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  describe('Constructor', () => {
    it('This test case aims to be defined', () => {
      expect(service).toBeDefined();
    });

    it('This test case aims to be instance of AppService', () => {
      expect(service).toBeInstanceOf(AppService);
    });

    it('This test case aims to create a new instance successfully', () => {
      const newService = new AppService();
      expect(newService).toBeDefined();
      expect(newService).toBeInstanceOf(AppService);
    });
  });

  describe('getHello', () => {
    it('This test case aims to return "Hello World!"', () => {
      const result = service.getHello();

      expect(result).toBe('Hello World!');
    });

    it('This test case aims to return a string', () => {
      const result = service.getHello();

      expect(typeof result).toBe('string');
    });

    it('This test case aims to return exactly "Hello World!" with correct casing', () => {
      const result = service.getHello();

      expect(result).not.toBe('hello world!');
      expect(result).not.toBe('HELLO WORLD!');
      expect(result).not.toBe('Hello world!');
      expect(result).toBe('Hello World!');
    });

    it('This test case aims to return string with correct length', () => {
      const result = service.getHello();

      expect(result.length).toBe(12);
    });

    it('This test case aims to return string starting with "Hello"', () => {
      const result = service.getHello();

      expect(result.startsWith('Hello')).toBe(true);
    });

    it('This test case aims to return string ending with "!"', () => {
      const result = service.getHello();

      expect(result.endsWith('!')).toBe(true);
    });

    it('This test case aims to contain "World"', () => {
      const result = service.getHello();

      expect(result).toContain('World');
    });

    it('This test case aims to contain a space character', () => {
      const result = service.getHello();

      expect(result).toContain(' ');
    });

    it('This test case aims to match the expected pattern', () => {
      const result = service.getHello();

      expect(result).toMatch(/^Hello\sWorld!$/);
    });

    it('This test case aims to be callable without parameters', () => {
      expect(() => service.getHello()).not.toThrow();
    });

    it('This test case aims to return same value on multiple calls', () => {
      const result1 = service.getHello();
      const result2 = service.getHello();
      const result3 = service.getHello();

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('This test case aims to not return null', () => {
      const result = service.getHello();

      expect(result).not.toBeNull();
    });

    it('This test case aims to not return undefined', () => {
      const result = service.getHello();

      expect(result).not.toBeUndefined();
    });

    it('This test case aims to not return empty string', () => {
      const result = service.getHello();

      expect(result).not.toBe('');
      expect(result.length).toBeGreaterThan(0);
    });

    it('This test case aims to be a truthy value', () => {
      const result = service.getHello();

      expect(result).toBeTruthy();
    });
  });

  describe('Method properties', () => {
    it('This test case aims to have getHello method', () => {
      expect(service.getHello).toBeDefined();
      expect(typeof service.getHello).toBe('function');
    });

    it('getHello should be bound to the service instance', () => {
      const boundMethod = service.getHello.bind(service);
      expect(boundMethod()).toBe('Hello World!');
    });
  });

  describe('Multiple instances', () => {
    it('This test case aims to return same value from different instances', () => {
      const service1 = new AppService();
      const service2 = new AppService();
      const service3 = new AppService();

      expect(service1.getHello()).toBe(service2.getHello());
      expect(service2.getHello()).toBe(service3.getHello());
    });

    it('This test case aims to create independent instances', () => {
      const service1 = new AppService();
      const service2 = new AppService();

      expect(service1).not.toBe(service2);
    });
  });

  describe('Edge cases', () => {
    it('This test case aims to handle rapid successive calls', () => {
      const results: string[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(service.getHello());
      }

      expect(results.every((r) => r === 'Hello World!')).toBe(true);
      expect(results).toHaveLength(100);
    });

    it('This test case aims to be deterministic', () => {
      const firstCall = service.getHello();

      // Call it many times
      for (let i = 0; i < 50; i++) {
        service.getHello();
      }

      const lastCall = service.getHello();

      expect(firstCall).toBe(lastCall);
    });
  });

  describe('String method compatibility', () => {
    it('This test case aims to be splittable', () => {
      const result = service.getHello();
      const words = result.split(' ');

      expect(words).toHaveLength(2);
      expect(words[0]).toBe('Hello');
      expect(words[1]).toBe('World!');
    });

    it('This test case aims to be convertible to lowercase', () => {
      const result = service.getHello();

      expect(result.toLowerCase()).toBe('hello world!');
    });

    it('This test case aims to be convertible to uppercase', () => {
      const result = service.getHello();

      expect(result.toUpperCase()).toBe('HELLO WORLD!');
    });

    it('This test case aims to be trimmable (no change expected)', () => {
      const result = service.getHello();

      expect(result.trim()).toBe(result);
    });

    it('This test case aims to support charAt', () => {
      const result = service.getHello();

      expect(result.charAt(0)).toBe('H');
      expect(result.charAt(6)).toBe('W');
      expect(result.charAt(11)).toBe('!');
    });

    it('This test case aims to support charCodeAt', () => {
      const result = service.getHello();

      expect(result.charCodeAt(0)).toBe(72); // 'H'
      expect(result.charCodeAt(6)).toBe(87); // 'W'
    });

    it('This test case aims to support indexOf', () => {
      const result = service.getHello();

      expect(result.indexOf('Hello')).toBe(0);
      expect(result.indexOf('World')).toBe(6);
      expect(result.indexOf('!')).toBe(11);
      expect(result.indexOf('xyz')).toBe(-1);
    });

    it('This test case aims to support replace', () => {
      const result = service.getHello();

      expect(result.replace('World', 'Universe')).toBe('Hello Universe!');
    });

    it('This test case aims to support slice', () => {
      const result = service.getHello();

      expect(result.slice(0, 5)).toBe('Hello');
      expect(result.slice(6)).toBe('World!');
    });

    it('This test case aims to support substring', () => {
      const result = service.getHello();

      expect(result.substring(0, 5)).toBe('Hello');
      expect(result.substring(6, 11)).toBe('World');
    });
  });

  describe('Type safety', () => {
    it('This test case aims to return string type', () => {
      const result = service.getHello();

      expect(typeof result).toBe('string');
      expect((result as any) instanceof String).toBe(false); // primitive, not String object
    });

    it('This test case aims to be assignable to string variable', () => {
      const result: string = service.getHello();

      expect(result).toBe('Hello World!');
    });
  });
});
