"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
require("reflect-metadata");
// test libraries
var sinon = require("sinon");
var request = require("supertest");
var chai_1 = require("chai");
var restify = require("restify");
var inversify_1 = require("inversify");
var server_1 = require("../src/server");
var decorators_1 = require("../src/decorators");
var constants_1 = require("../src/constants");
describe("Integration Tests:", function () {
    var server;
    var container;
    beforeEach(function (done) {
        // refresh container
        container = new inversify_1.Container();
        done();
    });
    describe("Routing & Request Handling:", function () {
        it("should work for async controller methods", function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) {
                    return new Promise((function (resolve) {
                        setTimeout(resolve, 100, "GET");
                    }));
                };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/"),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .set("Accept", "text/plain")
                .expect(200, "GET", done);
        });
        it("should work for a controller that throws an error", function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) {
                    throw new Error("some error");
                };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/"),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(500, {
                message: "some error"
            }, done);
        });
        it("should work for async controller methods that fails", function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) {
                    return new Promise((function (resolve, reject) {
                        setTimeout(reject, 100, "GET");
                    }));
                };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/"),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(500, done);
        });
        it("should work for each shortcut decorator", function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send("GET"); };
                TestController.prototype.postTest = function (req, res) { res.send("POST"); };
                TestController.prototype.putTest = function (req, res) { res.send("PUT"); };
                TestController.prototype.patchTest = function (req, res) { res.send("PATCH"); };
                TestController.prototype.headTest = function (req, res) { res.send("HEAD"); };
                TestController.prototype.deleteTest = function (req, res) { res.send("DELETE"); };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            __decorate([
                decorators_1.Post("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "postTest", null);
            __decorate([
                decorators_1.Put("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "putTest", null);
            __decorate([
                decorators_1.Patch("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "patchTest", null);
            __decorate([
                decorators_1.Head("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "headTest", null);
            __decorate([
                decorators_1.Delete("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "deleteTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/"),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            var agent = request(server.build());
            var deleteFn = function () { agent.delete("/").set("Accept", "text/plain").expect(200, "DELETE", done); };
            var head = function () { agent.head("/").set("Accept", "text/plain").expect(200, "HEAD", deleteFn); };
            var patch = function () { agent.patch("/").set("Accept", "text/plain").expect(200, "PATCH", head); };
            var put = function () { agent.put("/").set("Accept", "text/plain").expect(200, "PUT", patch); };
            var post = function () { agent.post("/").set("Accept", "text/plain").expect(200, "POST", put); };
            var get = function () { agent.get("/").set("Accept", "text/plain").expect(200, "GET", post); };
            get();
        });
        it("should work for more obscure HTTP methods using the Method decorator", function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send("OPTIONS"); };
                return TestController;
            }());
            __decorate([
                decorators_1.Method("opts", "/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/"),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            request(server.build())
                .options("/")
                .set("Accept", "text/plain")
                .expect(200, "OPTIONS", done);
        });
        it("should use returned values as response", function (done) {
            var result = { "hello": "world" };
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { return result; };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/"),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(200, JSON.stringify(result), done);
        });
        it("should allow server options", function (done) {
            var result = { "hello": "world" };
            var customHeaderName = "custom-header-name";
            var customHeaderValue = "custom-header-value";
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { return result; };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/"),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container, { formatters: {
                    "application/json": function formatFoo(req, res, body, cb) {
                        res.setHeader(customHeaderName, customHeaderValue);
                        return cb();
                    }
                } });
            request(server.build())
                .get("/")
                .expect(customHeaderName, customHeaderValue)
                .expect(200, done);
        });
    });
    describe("Middleware:", function () {
        var result;
        var middleware = {
            a: function (req, res, next) {
                result += "a";
                next();
            },
            b: function (req, res, next) {
                result += "b";
                next();
            },
            c: function (req, res, next) {
                result += "c";
                next();
            }
        };
        var spyA = sinon.spy(middleware, "a");
        var spyB = sinon.spy(middleware, "b");
        var spyC = sinon.spy(middleware, "c");
        beforeEach(function (done) {
            result = "";
            spyA.reset();
            spyB.reset();
            spyC.reset();
            done();
        });
        it("should call method-level middleware correctly", function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send("GET"); };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/", spyA, spyB, spyC),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/"),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                chai_1.expect(spyA.calledOnce).to.be.true;
                chai_1.expect(spyB.calledOnce).to.be.true;
                chai_1.expect(spyC.calledOnce).to.be.true;
                chai_1.expect(result).to.equal("abc");
                done();
            });
        });
        it("should call controller-level middleware correctly", function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send("GET"); };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/", spyA, spyB, spyC),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                chai_1.expect(spyA.calledOnce).to.be.true;
                chai_1.expect(spyB.calledOnce).to.be.true;
                chai_1.expect(spyC.calledOnce).to.be.true;
                chai_1.expect(result).to.equal("abc");
                done();
            });
        });
        it("should call server-level middleware correctly", function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send("GET"); };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/"),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/"),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            server.setConfig(function (app) {
                app.use(spyA);
                app.use(spyB);
                app.use(spyC);
            });
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                chai_1.expect(spyA.calledOnce).to.be.true;
                chai_1.expect(spyB.calledOnce).to.be.true;
                chai_1.expect(spyC.calledOnce).to.be.true;
                chai_1.expect(result).to.equal("abc");
                done();
            });
        });
        it("should call all middleware in correct order", function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send("GET"); };
                return TestController;
            }());
            __decorate([
                decorators_1.Get("/", spyC),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object, Object]),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "getTest", null);
            TestController = __decorate([
                inversify_1.injectable(),
                decorators_1.Controller("/", spyB),
                __metadata("design:paramtypes", [])
            ], TestController);
            container.bind(constants_1.TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            server = new server_1.InversifyRestifyServer(container);
            server.setConfig(function (app) {
                app.use(spyA);
            });
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                chai_1.expect(spyA.calledOnce).to.be.true;
                chai_1.expect(spyB.calledOnce).to.be.true;
                chai_1.expect(spyC.calledOnce).to.be.true;
                chai_1.expect(result).to.equal("abc");
                done();
            });
        });
    });
});
