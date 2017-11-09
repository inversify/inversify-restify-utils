import * as request from "supertest";
import { InversifyRestifyServer } from "../src/server";
import { interfaces } from "../src/interfaces";
import { Controller, Get } from "../src/decorators";
import { Container, injectable } from "inversify";
import { TYPE } from "../src/constants";
import * as sinon from "sinon";
import { expect } from "chai";

describe("Unit Test: Bugs", () => {
    let container = new Container();
    let server: InversifyRestifyServer;

    it("should fire the 'after' event when the controller function returns a Promise", (done) => {
        @injectable()
        @Controller("/")
        class TestController {
            @Get("/promise") public getTest() {
                return new Promise(((resolve) => {
                    setTimeout(resolve, 100, "GET");
                }));
            }
        }

        let spyA = sinon.spy((req: any, res: any) => null);

        container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

        server = new InversifyRestifyServer(container);
        server.setConfig((app) => {
            app.on("after", spyA);
        });

        request(server.build())
            .get("/noPromise")
            .set("Accept", "text/plain")
            .expect(200, "GET", () => {
                expect(spyA.calledOnce).to.eq(true);
                done();
            });

    });

    it("should fire the 'after' event when the controller function returns", (done) => {
        @injectable()
        @Controller("/")
        class TestController {
            @Get("/noPromise") public getNoPromise() {
                return "GET";
            }
        }

        let spyA = sinon.spy((req: any, res: any) => null);

        container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

        server = new InversifyRestifyServer(container);
        server.setConfig((app) => {
            app.on("after", spyA);
        });

        request(server.build())
            .get("/")
            .set("Accept", "text/plain")
            .expect(200, "GET", () => {
                expect(spyA.calledOnce).to.eq(true);
                done();
            });

    });
});
