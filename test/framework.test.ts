import { Container, injectable } from "inversify";
import { Next, Request, RequestHandler, Response } from "restify";
import request from "supertest";
import { TYPE } from "../src/constants";
import { Controller, Delete, Get, Head, Method, Patch, Post, Put } from "../src/decorators";
import { interfaces } from "../src/interfaces";
import { InversifyRestifyServer } from "../src/server";


describe("Integration Tests:", () => {
    let server: InversifyRestifyServer;
    let container: Container;

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
                @Get("/") public getTest(req: Request, res: Response) { res.send("GET"); }
                @Post("/") public postTest(req: Request, res: Response) { res.send("POST"); }
                @Put("/") public putTest(req: Request, res: Response) { res.send("PUT"); }
                @Patch("/") public patchTest(req: Request, res: Response) { res.send("PATCH"); }
                @Head("/") public headTest(req: Request, res: Response) { res.send("HEAD"); }
                @Delete("/") public deleteTest(req: Request, res: Response) { res.send("DELETE"); }
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
                @Method("opts", "/") public getTest(req: Request, res: Response) { res.send("OPTIONS"); }
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
                @Get("/") public getTest(req: Request, res: Response) { return result; }
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
                @Get("/") public getTest(req: Request, res: Response) { return result; }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(
                container,
                {
                    formatters: {
                        "application/json": (req: Request, res: Response, body: any) => {
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
                @Get("/") public getTest(req: Request, res: Response) { return result; }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(
                container,
                {
                    defaultRoot: "/v1",
                    formatters: {
                        "application/json": (req: Request, res: Response, body: any) => {
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
            a: function (req: Request, res: Response, next: Next) {
                result += "a";
                next();
            },
            b: function (req: Request, res: Response, next: Next) {
                result += "b";
                next();
            },
            c: function (req: Request, res: Response, next: Next) {
                result += "c";
                next();
            }
        };
        let spyA = jest.fn().mockImplementation(middleware.a);
        let spyB = jest.fn().mockImplementation(middleware.b);
        let spyC = jest.fn().mockImplementation(middleware.c);

        beforeEach((done) => {
            result = "";
            spyA.mockClear();
            spyB.mockClear();
            spyC.mockClear();
            done();
        });

        it("should call method-level middleware correctly", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/", spyA, spyB, spyC) public getTest(req: Request, res: Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA).toHaveBeenCalledTimes(1);
                    expect(spyB).toHaveBeenCalledTimes(1);
                    expect(spyC).toHaveBeenCalledTimes(1);
                    expect(result).toEqual("abc");
                    done();
                });
        });


        it("should call controller-level middleware correctly", (done) => {
            @injectable()
            @Controller("/", spyA, spyB, spyC)
            class TestController {
                @Get("/") public getTest(req: Request, res: Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA).toHaveBeenCalledTimes(1);
                    expect(spyB).toHaveBeenCalledTimes(1);
                    expect(spyC).toHaveBeenCalledTimes(1);
                    expect(result).toEqual("abc");
                    done();
                });
        });


        it("should call server-level middleware correctly", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: Request, res: Response) { res.send("GET"); }
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
                    expect(spyA).toHaveBeenCalledTimes(1);
                    expect(spyB).toHaveBeenCalledTimes(1);
                    expect(spyC).toHaveBeenCalledTimes(1);
                    expect(result).toEqual("abc");
                    done();
                });
        });


        it("should call all middleware in correct order", (done) => {
            @injectable()
            @Controller("/", spyB)
            class TestController {
                @Get("/", spyC) public getTest(req: Request, res: Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyRestifyServer(container);

            server.setConfig((app) => {
                app.use(spyA);
            });

            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA).toHaveBeenCalledTimes(1);
                    expect(spyB).toHaveBeenCalledTimes(1);
                    expect(spyC).toHaveBeenCalledTimes(1);
                    expect(result).toEqual("abc");
                    done();
                });
        });

        it("should resolve controller-level middleware", (done) => {
            const symbolId = Symbol.for("spyA");
            const strId = "spyB";

            @injectable()
            @Controller("/", symbolId, strId)
            class TestController {
                @Get("/") public getTest(req: Request, res: Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyRestifyServer(container);

            request(server.build())
                .get("/")
                .expect(200, "GET", function() {
                    expect(spyA).toHaveBeenCalledTimes(1);
                    expect(spyB).toHaveBeenCalledTimes(1);
                    expect(result).toEqual("ab");
                    done();
                });
        });

        it("should resolve method-level middleware", (done) => {
            const symbolId = Symbol.for("spyA");
            const strId = "spyB";

            @injectable()
            @Controller("/")
            class TestController {
                @Get("/", symbolId, strId)
                public getTest(req: Request, res: Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyRestifyServer(container);

            request(server.build())
                .get("/")
                .expect(200, "GET", () => {
                    expect(spyA).toHaveBeenCalledTimes(1);
                    expect(spyB).toHaveBeenCalledTimes(1);
                    expect(result).toEqual("ab");
                    done();
                });
        });

        it("should compose controller- and method-level middleware", (done) => {
            const symbolId = Symbol.for("spyA");
            const strId = "spyB";

            @injectable()
            @Controller("/", symbolId)
            class TestController {
                @Get("/", strId)
                public async getTest(req: Request, res: Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyRestifyServer(container);

            request(server.build())
                .get("/")
                .expect(200, "GET", function() {
                    expect(spyA).toHaveBeenCalledTimes(1);
                    expect(spyB).toHaveBeenCalledTimes(1);
                    expect(result).toEqual("ab");
                    done();
                });
        });
    });
});
