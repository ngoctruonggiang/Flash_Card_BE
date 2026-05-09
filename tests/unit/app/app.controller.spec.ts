import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';

describe('AppController Tests', () => {
  let controller: AppController;
  let appService: AppService;

  beforeEach(() => {
    appService = new AppService();
    controller = new AppController(appService);
  });

  describe('Constructor', () => {
    it('This test case aims to be defined', () => {
      expect(controller).toBeDefined();
    });

    it('This test case aims to be instance of AppController', () => {
      expect(controller).toBeInstanceOf(AppController);
    });

    it('This test case aims to have appService injected', () => {
      // Access private property for testing
      expect(
        (controller as unknown as { appService: AppService }).appService,
      ).toBeDefined();
    });
  });

  describe('getHello', () => {
    it('This test case aims to return null', () => {
      const result = controller.getHello();

      expect(result).toBeNull();
    });

    it('This test case aims to return null type value', () => {
      const result = controller.getHello();

      expect(result).toBe(null);
      expect(typeof result).toBe('object');
    });

    it('This test case aims to be callable without parameters', () => {
      expect(() => controller.getHello()).not.toThrow();
    });

    it('This test case aims to consistently return null on multiple calls', () => {
      const result1 = controller.getHello();
      const result2 = controller.getHello();
      const result3 = controller.getHello();

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    it('This test case aims to not return undefined', () => {
      const result = controller.getHello();

      expect(result).not.toBeUndefined();
    });

    it('This test case aims to not return an object with properties', () => {
      const result = controller.getHello();

      expect(result).not.toEqual({});
    });

    it('This test case aims to not return a string', () => {
      const result = controller.getHello();

      expect(typeof result).not.toBe('string');
    });

    it('This test case aims to not return a number', () => {
      const result = controller.getHello();

      expect(typeof result).not.toBe('number');
    });

    it('This test case aims to not return a boolean', () => {
      const result = controller.getHello();

      expect(typeof result).not.toBe('boolean');
    });
  });

  describe('Controller metadata', () => {
    it('This test case aims to have getHello method', () => {
      expect(controller.getHello).toBeDefined();
      expect(typeof controller.getHello).toBe('function');
    });

    it('getHello should be bound to the controller instance', () => {
      const method = controller.getHello.bind(controller);
      expect(method()).toBeNull();
    });
  });

  describe('Integration with AppService', () => {
    it('This test case aims to work independently of AppService getHello', () => {
      // Controller's getHello doesn't actually use AppService's getHello
      // This test verifies that behavior
      const mockAppService = {
        getHello: jest.fn().mockReturnValue('Mock Hello'),
      } as unknown as AppService;

      const controllerWithMock = new AppController(mockAppService);
      const result = controllerWithMock.getHello();

      // AppController.getHello returns null, not the service's value
      expect(result).toBeNull();
      expect(mockAppService.getHello).not.toHaveBeenCalled();
    });

    it('This test case aims to not call AppService when getHello is invoked', () => {
      const serviceSpy = jest.spyOn(appService, 'getHello');

      controller.getHello();

      expect(serviceSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('This test case aims to handle rapid successive calls', () => {
      const results: unknown[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(controller.getHello());
      }

      expect(results.every((r) => r === null)).toBe(true);
      expect(results).toHaveLength(100);
    });

    it('This test case aims to work with new controller instances', () => {
      const newService = new AppService();
      const newController = new AppController(newService);

      expect(newController.getHello()).toBeNull();
    });
  });
});
