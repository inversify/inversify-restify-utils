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

        expect(configFn.called).to.eq(false);

        server.build();

        expect(configFn.calledOnce).to.eq(true);
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
        expect(routeOne).not.to.eq(undefined);

        let routeTwo = app.router.routes.GET.find(route => route.spec.path === "/root/routeTwo");
        expect(routeTwo).not.to.eq(undefined);
        expect((<any>routeTwo).spec.options).to.eq("test");

          let routeThree = app.router.routes.GET.find(route => route.spec.path === "/root/routeThree");
        expect(routeThree).not.to.eq(undefined);

    });

    it.only("should generate routes for controller methods using defaultRoot", () => {

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

        let server = new InversifyRestifyServer(container, {
            defaultRoot: "/v1"
        });

        let app = server.build();

        let routes = (<any>Object).values(app.router._registry._routes);

        let routeOne = routes.find((route: any) => route.path === "/v1/root/routeOne" && route.method === "GET");
        expect(routeOne).not.to.eq(undefined);

        let routeTwo = routes.find((route: any) => route.path === "/v1/root/routeTwo" && route.method === "GET");
        expect(routeTwo).not.to.eq(undefined);
        expect((<any>routeTwo).spec.options).to.eq("test");

        let routeThree = routes.find((route: any) => route.path === "/v1/root/routeThree" && route.method === "GET");
        expect(routeThree).not.eq(undefined);

    });

});
