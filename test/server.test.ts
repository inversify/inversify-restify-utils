import { expect } from "chai";
import * as sinon from "sinon";
import * as restify from "restify";
import { InversifyRestifyServer } from "../src/server";
import { Controller, Method } from "../src/decorators";
import { Container, injectable } from "inversify";
import { TYPE } from "../src/constants";

describe("Unit Test: InversifyRestifyServer", () => {

    it("should call the configFn", () => {
        let middleware = function(req: restify.Request, res: restify.Response, next: restify.Next) { return; };
        let configFn = sinon.spy((app: restify.Server) => { app.use(middleware); });
        let container = new Container();

        @injectable()
        class TestController {}

        container.bind(TYPE.Controller).to(TestController);
        let server = new InversifyRestifyServer(container);

        server.setConfig(configFn);

        expect(configFn.called).to.be.false;

        server.build();

        expect(configFn.calledOnce).to.be.true;
    });

    it("should generate routes for controller methods", () => {

        @injectable()
        @Controller("/root")
        class TestController {
            @Method("get", "/routeOne")
            public routeOne() { return; }

            @Method("get", { options: "test", path: "/routeTwo" })
            public routeTwo() { return; }

            @Method("get", { path: "/routeThree" })
            public routeThree() { return; }
        }

        let container = new Container();
        container.bind(TYPE.Controller).to(TestController);
        let server = new InversifyRestifyServer(container);
        let app = server.build();

        let routeOne = app.router.routes.GET.find(route => route.spec.path === "/root/routeOne");
        expect(routeOne).not.to.be.undefined;

        let routeTwo = app.router.routes.GET.find(route => route.spec.path === "/root/routeTwo");
        expect(routeTwo).not.to.be.undefined;
        expect((<any>routeTwo).spec.options).to.eq("test");

        let routeThree = app.router.routes.GET.find(route => route.spec.path === "/root/routeThree");
        expect(routeThree).not.to.be.undefined;

    });
});
