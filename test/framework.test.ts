import "reflect-metadata";

import * as sinon from "sinon";
import * as request from "supertest";
import { expect } from "chai";
import * as inversify from "inversify";
import * as restify from "restify";
import { injectable, Container } from "inversify";
import { interfaces } from "../src/interfaces";
import { InversifyRestifyServer } from "../src/server";
import { Controller, Method, Get, Post, Put, Patch, Head, Delete } from "../src/decorators";
import { TYPE } from "../src/constants";

describe("Integration Tests:", () => {
    let server: InversifyRestifyServer;
    let container: inversify.interfaces.Container;

    beforeEach((done) => {
        // refresh container
        container = new Container();
        done();
    });

    describe("Routing & Request Handling:", () => {

        it("should work for async controller methods", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest() {
                    return new Promise(((resolve) => {
                        setTimeout(resolve, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .set("Accept", "text/plain")
                .expect(200, "GET", done);
        });

        it("should work for async controller methods that fails", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest() {
                    return new Promise(((resolve, reject) => {
                        setTimeout(reject, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(500, done);
        });


        it("should work for each shortcut decorator", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: restify.Request, res: restify.Response) { res.send("GET"); }
                @Post("/") public postTest(req: restify.Request, res: restify.Response) { res.send("POST"); }
                @Put("/") public putTest(req: restify.Request, res: restify.Response) { res.send("PUT"); }
                @Patch("/") public patchTest(req: restify.Request, res: restify.Response) { res.send("PATCH"); }
                @Head("/") public headTest(req: restify.Request, res: restify.Response) { res.send("HEAD"); }
                @Delete("/") public deleteTest(req: restify.Request, res: restify.Response) { res.send("DELETE"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);
            let agent = request(server.build());

            let deleteFn = () => { agent.delete("/").set("Accept", "text/plain").expect(200, "DELETE", done); };
            let head = () => { agent.head("/").set("Accept", "text/plain").expect(200, "HEAD", deleteFn); };
            let patch = () => { agent.patch("/").set("Accept", "text/plain").expect(200, "PATCH", head); };
            let put = () => { agent.put("/").set("Accept", "text/plain").expect(200, "PUT", patch); };
            let post = () => { agent.post("/").set("Accept", "text/plain").expect(200, "POST", put); };
            let get = () => { agent.get("/").set("Accept", "text/plain").expect(200, "GET", post); };

            get();
        });


        it("should work for more obscure HTTP methods using the Method decorator", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Method("opts", "/") public getTest(req: restify.Request, res: restify.Response) { res.send("OPTIONS"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);
            request(server.build())
                .options("/")
                .set("Accept", "text/plain")
                .expect(200, "OPTIONS", done);
        });


        it("should use returned values as response", (done) => {
            let result = {"hello": "world"};

            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: restify.Request, res: restify.Response) { return result; }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(200, JSON.stringify(result), done);
        });

        it("should allow server options", (done) => {
            let result = {"hello": "world"};
            let customHeaderName = "custom-header-name";
            let customHeaderValue = "custom-header-value";

            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: restify.Request, res: restify.Response) { return result; }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(
                container,
                {
                    formatters: {
                        "application/json": (req: restify.Request, res: restify.Response, body: any) => {
                            res.setHeader(customHeaderName, customHeaderValue);
                            return null;
                        }
                    }
                }
            );
            request(server.build())
                .get("/")
                .expect(customHeaderName, customHeaderValue)
                .expect(200, done);
        });

        it("should allow server options with defaultRoot", (done) => {
            let result = {"hello": "world"};
            let customHeaderName = "custom-header-name";
            let customHeaderValue = "custom-header-value";

            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: restify.Request, res: restify.Response) { return result; }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(
                container,
                {
                    defaultRoot: "/v1",
                    formatters: {
                        "application/json": (req: restify.Request, res: restify.Response, body: any) => {
                            res.setHeader(customHeaderName, customHeaderValue);
                            return null;
                        }
                    }
                }
            );
            request(server.build())
                .get("/v1")
                .expect(customHeaderName, customHeaderValue)
                .expect(200, done);
        });
    });


    describe("Middleware:", () => {
        let result: string;
        let middleware: any = {
            a: function (req: restify.Request, res: restify.Response, next: restify.Next) {
                result += "a";
                next();
            },
            b: function (req: restify.Request, res: restify.Response, next: restify.Next) {
                result += "b";
                next();
            },
            c: function (req: restify.Request, res: restify.Response, next: restify.Next) {
                result += "c";
                next();
            }
        };
        let spyA = sinon.spy(middleware, "a");
        let spyB = sinon.spy(middleware, "b");
        let spyC = sinon.spy(middleware, "c");

        beforeEach((done) => {
            result = "";
            spyA.reset();
            spyB.reset();
            spyC.reset();
            done();
        });

        it("should call method-level middleware correctly", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/", spyA, spyB, spyC) public getTest(req: restify.Request, res: restify.Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.eq(true);
                    expect(spyB.calledOnce).to.eq(true);
                    expect(spyC.calledOnce).to.eq(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });


        it("should call controller-level middleware correctly", (done) => {
            @injectable()
            @Controller("/", spyA, spyB, spyC)
            class TestController {
                @Get("/") public getTest(req: restify.Request, res: restify.Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.eq(true);
                    expect(spyB.calledOnce).to.eq(true);
                    expect(spyC.calledOnce).to.eq(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });


        it("should call server-level middleware correctly", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: restify.Request, res: restify.Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);

            server.setConfig((app) => {
               app.use(spyA);
               app.use(spyB);
               app.use(spyC);
            });

            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.eq(true);
                    expect(spyB.calledOnce).to.eq(true);
                    expect(spyC.calledOnce).to.eq(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });


        it("should call all middleware in correct order", (done) => {
            @injectable()
            @Controller("/", spyB)
            class TestController {
                @Get("/", spyC) public getTest(req: restify.Request, res: restify.Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);

            server.setConfig((app) => {
               app.use(spyA);
            });

            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.eq(true);
                    expect(spyB.calledOnce).to.eq(true);
                    expect(spyC.calledOnce).to.eq(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should resolve controller-level middleware", (done) => {
            const symbolId = Symbol("spyA");
            const strId = "spyB";

            @injectable()
            @Controller("/", symbolId, strId)
            class TestController {
                @Get("/") public getTest(req: restify.Request, res: restify.Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<restify.RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<restify.RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyRestifyServer(container);

            request(server.build())
                .get("/")
                .expect(200, "GET", function() {
                    expect(spyA.calledOnce).to.eq(true);
                    expect(spyB.calledOnce).to.eq(true);
                    expect(result).to.equal("ab");
                    done();
                });
        });

        it("should resolve method-level middleware", (done) => {
            const symbolId = Symbol("spyA");
            const strId = "spyB";

            @injectable()
            @Controller("/")
            class TestController {
                @Get("/", symbolId, strId)
                public getTest(req: restify.Request, res: restify.Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<restify.RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<restify.RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyRestifyServer(container);

            request(server.build())
                .get("/")
                .expect(200, "GET", function() {
                    expect(spyA.calledOnce).to.eq(true);
                    expect(spyB.calledOnce).to.eq(true);
                    expect(result).to.equal("ab");
                    done();
                });
        });

        it("should compose controller- and method-level middleware", (done) => {
            const symbolId = Symbol("spyA");
            const strId = "spyB";

            @injectable()
            @Controller("/", symbolId)
            class TestController {
                @Get("/", strId)
                public getTest(req: restify.Request, res: restify.Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<restify.RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<restify.RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyRestifyServer(container);

            request(server.build())
                .get("/")
                .expect(200, "GET", function() {
                    expect(spyA.calledOnce).to.eq(true);
                    expect(spyB.calledOnce).to.eq(true);
                    expect(result).to.equal("ab");
                    done();
                });
        });
    });
});
