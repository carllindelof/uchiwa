'use strict';

describe('Controller', function () {
  var $rootScope;
  var $scope;
  var createController;
  var mockNotification;
  var socket;
  var mockStashesService;
  var mockRoutingService;

  beforeEach(module('uchiwa'));

  beforeEach(function () {
    mockNotification = jasmine.createSpy('mockNotification');
    mockStashesService = jasmine.createSpyObj('mockStashesService', ['stash']);
    mockRoutingService = jasmine.createSpyObj('mockRoutingService', ['search', 'go', 'initFilters', 'permalink', 'updateFilters']);
    module(function ($provide) {
      $provide.value('notification', mockNotification);
      $provide.value('stashesService', mockStashesService);
      $provide.value('routingService', mockRoutingService);
    });
  });

  beforeEach(inject(function ($controller, _$rootScope_, _socket_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    socket = _socket_;
    createController = function (controllerName, properties) {
      return $controller(controllerName, _.extend({
        '$scope': $scope
      }, properties));
    };
  }));

  describe('init', function () {
    var controllerName = 'init';

    it('should emit get_sensu on route change success', function () {
      createController(controllerName);
      spyOn(socket, 'emit');
      var expectedEvent = 'get_sensu';
      var expectedPayload = {};

      $rootScope.$broadcast('$routeChangeSuccess', {});

      expect(socket.emit).toHaveBeenCalledWith(expectedEvent, expectedPayload);
    });

    it('should create notification on messenger event', function () {
      var expectedType = 'success';
      var expectedMessage = '<strong>Success!</strong> The stash has been created.';
      var payload = {content: angular.toJson({type: 'success', content: expectedMessage})};
      createController(controllerName);

      socket.receive('messenger', payload);

      expect(mockNotification).toHaveBeenCalledWith(expectedType, expectedMessage);
    });
  });

  describe('checks', function() {
    var controllerName = 'checks';

    it('should have a subscribersSummary method', function() {
      createController(controllerName);
      expect($scope.subscribersSummary).toBeDefined();
    });

    it('should listen for socket:sensu event', function() {
      spyOn($scope, '$on').and.callThrough();
      createController(controllerName);
      expect($scope.$on).toHaveBeenCalledWith('socket:sensu', jasmine.any(Function));
    });

    it('should handle the socket:sensu event', function() {
      createController(controllerName);
      expect($scope.dc).toBeUndefined();
      expect($scope.checks).toBeUndefined();

      var mockContent = {
        dc: 'abcd',
        checks: 'efgh'
      };
      $scope.$emit('socket:sensu', {content: JSON.stringify(mockContent)});

      expect($scope.dc).toBe(mockContent.dc);
      expect($scope.checks).toBe(mockContent.checks);
    });

    describe('subscribersSummary()', function() {

      it('should join strings', function() {
        var mockArray = ['test', 'a', 'b', 'c'];
        var mockString = 'test a b c';
        createController(controllerName);

        expect($scope.subscribersSummary(mockArray)).toBe(mockString);
      });

    });

  });

  describe('client', function() {
    var controllerName = 'client';

    it('should have a remove method', function () {
      createController(controllerName);
      expect($scope.remove).toBeDefined();
    });
    it('should have a resolve method', function () {
      createController(controllerName);
      expect($scope.resolve).toBeDefined();
    });
    it('should have a permalink method', function () {
      createController(controllerName);
      expect($scope.permalink).toBeDefined();
    });
    it('should have a stash method', function () {
      createController(controllerName);
      expect($scope.stash).toBeDefined();
    });

    it('should emit get_client', function () {
      createController(controllerName);
      spyOn(socket, 'emit');
      $scope.dcId = 'foo';
      $scope.clientId = 'bar';
      var expectedEventName = 'get_client';
      var expectedPayload = {dc: $scope.dcId, client: $scope.clientId};

      $scope.pull();

      expect(socket.emit).toHaveBeenCalledWith(expectedEventName, expectedPayload);
    });

  });

  describe('clients', function () {
    var controllerName = 'clients';

    it('should have a go method', function () {
      createController(controllerName);
      expect($scope.go).toBeDefined();
    });
    it('should have a stash method', function () {
      createController(controllerName);
      expect($scope.stash).toBeDefined();
    });
    it('should have a permalink method', function() {
      createController(controllerName);
      expect($scope.permalink).toBeDefined();
    });

    describe('permalink()', function() {

      it('should call routing service permalink method', function() {
        createController(controllerName);
        $scope.permalink();
        expect(mockRoutingService.permalink).toHaveBeenCalled();
      });

    })
  });

  describe('events', function () {
    var controllerName = 'events';

    it('should have a go method', function () {
      createController(controllerName);
      expect($scope.go).toBeDefined();
    });
    it('should have a stash method', function () {
      createController(controllerName);
      expect($scope.stash).toBeDefined();
    });
  });

  describe('navbar', function () {
    var controllerName = 'navbar';

    it('should count events and client status on socket:sensu', function () {
      createController(controllerName);
      var expectedClients = [
        {
          status: 2
        },
        {
          status: 2
        },
        {
          status: 1
        },
        {
          status: 1
        },
        {
          status: 3
        }
      ];
      var expectedCriticalClients = 2;
      var expectedWarningClients = 2;
      var expectedUnknownClients = 1;
      var expectedTotalClients = 5;
      var expectedClientsStyle = 'critical';

      var expectedEvents = [
        {
          check: {
            status: 2
          }
        },
        {
          check: {
            status: 2
          }
        },
        {
          check: {
            status: 1
          }
        },
        {
          check: {
            status: 1
          }
        },
        {
          check: {
            status: 3
          }
        }
      ];
      var expectedCriticalEvents = 2;
      var expectedWarningEvents = 2;
      var expectedUnknownEvents = 1;
      var expectedTotalEvents = 5;
      var expectedEventsStyle = 'critical';

      var payload = {
        content: angular.toJson({events: expectedEvents, clients: expectedClients})
      };

      $rootScope.$broadcast('socket:sensu', payload);

      expect($scope.clients.critical).toEqual(expectedCriticalClients);
      expect($scope.clients.warning).toEqual(expectedWarningClients);
      expect($scope.clients.unknown).toEqual(expectedUnknownClients);
      expect($scope.clients.total).toEqual(expectedTotalClients);
      expect($scope.events.critical).toEqual(expectedCriticalEvents);
      expect($scope.events.warning).toEqual(expectedWarningEvents);
      expect($scope.events.unknown).toEqual(expectedUnknownEvents);
      expect($scope.events.total).toEqual(expectedTotalEvents);
      expect($scope.clients.style).toEqual(expectedClientsStyle);
      expect($scope.events.style).toEqual(expectedEventsStyle);
    });

    it('should count unknown events and clients status on socket:sensu', function () {
      createController(controllerName);
      var expectedClients = [
        {
          status: 3
        },
        {
          status: 3
        }
      ];
      var expectedCriticalClients = 0;
      var expectedWarningClients = 0;
      var expectedUnknownClients = 2;
      var expectedTotalClients = 2;
      var expectedClientsStyle = 'unknown';

      var expectedEvents = [
        {
          check: {
            status: 3
          }
        },
        {
          check: {
            status: 3
          }
        }
      ];
      var expectedCriticalEvents = 0;
      var expectedWarningEvents = 0;
      var expectedUnknownEvents = 2;
      var expectedTotalEvents = 2;
      var expectedEventsStyle = 'unknown';

      var payload = {
        content: angular.toJson({events: expectedEvents, clients: expectedClients})
      };

      $rootScope.$broadcast('socket:sensu', payload);

      expect($scope.clients.critical).toEqual(expectedCriticalClients);
      expect($scope.clients.warning).toEqual(expectedWarningClients);
      expect($scope.clients.unknown).toEqual(expectedUnknownClients);
      expect($scope.clients.total).toEqual(expectedTotalClients);
      expect($scope.events.critical).toEqual(expectedCriticalEvents);
      expect($scope.events.warning).toEqual(expectedWarningEvents);
      expect($scope.events.unknown).toEqual(expectedUnknownEvents);
      expect($scope.events.total).toEqual(expectedTotalEvents);
      expect($scope.clients.style).toEqual(expectedClientsStyle);
      expect($scope.events.style).toEqual(expectedEventsStyle);
    });
  });

  describe('sidebar', function() {
    var controllerName = 'sidebar';

    it('should have a getClass method', function() {
      createController(controllerName);
      expect($scope.getClass).toBeDefined();
    });

    describe('getClass()', function() {

      it('should return selected if path matches location', function() {
        createController(controllerName, {
          '$location': {
            path: function() {
              return 'events#some-anchor';
            }
          }
        });
        expect($scope.getClass('events')).toBe('selected');
        expect($scope.getClass('clients')).toBe('');
      });

    });

  });

  describe('stashes', function () {
    var controllerName = 'stashes';

    it("should delete stash", function () {
      createController(controllerName);
      var expectedDcName = 'API 1';
      var stashToDelete = {name: 'stash'};
      var stashesForDc = [stashToDelete];

      var payload = {
        content: angular.toJson({dc: [{name: expectedDcName}], stashes: stashesForDc })
      };
      $rootScope.$broadcast('socket:sensu', payload);

      $scope.deleteStash('API 1', stashToDelete, 0);

      expect($scope.sensu.stashes).not.toContain(stashToDelete);
      expect(mockStashesService.stash).toHaveBeenCalledWith(expectedDcName, stashToDelete);
    });
  });

  describe('settings', function () {
    var controllerName = 'settings';

    it("should emit a theme:changed event when the current theme changes", function () {
      createController(controllerName);
      var expectedTheme = 'foo theme';
      var expectedEvent = 'theme:changed';
      spyOn($scope, '$emit');

      $scope.currentTheme = expectedTheme;

      $scope.$apply();
      expect($scope.$emit).toHaveBeenCalledWith(expectedEvent, expectedTheme);
    });
  });
});